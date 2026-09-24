const HealthcareService = require('../models/healthcareService.model');
const Hospital = require('../models/hospital.model');
const AppError = require('../utils/AppError');
const { getPagination, buildPaginationMetadata } = require('../utils/pagination');

class HealthcareServiceManager {
  /**
   * Get active healthcare services for user home / navigation sorted by displayOrder
   */
  async getActiveServices() {
    const services = await HealthcareService.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();
    return services;
  }

  /**
   * Admin: Get all healthcare services with search, status filters and pagination
   */
  async getAllServices(query = {}) {
    const filter = {};
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { slug: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.status && query.status !== 'ALL') {
      filter.isActive = query.status === 'active' || query.status === 'true';
    }

    const { page, limit, skip } = getPagination(query.page, query.limit, 10, 50);

    const [services, total] = await Promise.all([
      HealthcareService.find(filter)
        .sort({ displayOrder: 1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HealthcareService.countDocuments(filter),
    ]);

    return {
      services,
      pagination: buildPaginationMetadata(total, page, limit),
    };
  }

  /**
   * Admin: Create a new Healthcare Service
   */
  async createService(data) {
    const name = data.name ? data.name.trim() : '';
    if (!name) {
      throw new AppError('Healthcare service name is required.', 422);
    }

    const slug = (data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || 'service';
    
    // Check duplicate name / slug
    const existing = await HealthcareService.findOne({
      $or: [{ name: { $regex: new RegExp(`^${name}$`, 'i') } }, { slug }],
    });
    if (existing) {
      throw new AppError('A healthcare service with this name already exists.', 409);
    }

    const service = await HealthcareService.create({
      name,
      slug,
      description: data.description ? data.description.trim() : '',
      icon: data.icon || 'medical',
      facilityType: data.facilityType || slug,
      mode: data.mode || null,
      color: data.color || '#2F65CB',
      bgColor: data.bgColor || '#EFF6FF',
      borderColor: data.borderColor || '#BFDBFE',
      displayOrder: Number(data.displayOrder) >= 0 ? Number(data.displayOrder) : 1,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    });

    return service;
  }

  /**
   * Admin: Update existing Healthcare Service
   */
  async updateService(id, data) {
    const service = await HealthcareService.findById(id);
    if (!service) {
      throw new AppError('Healthcare service not found.', 404);
    }

    if (data.name && data.name.trim() !== service.name) {
      const trimmed = data.name.trim();
      const duplicate = await HealthcareService.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${trimmed}$`, 'i') },
      });
      if (duplicate) {
        throw new AppError('A healthcare service with this name already exists.', 409);
      }
      service.name = trimmed;
      if (!data.slug) {
        service.slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    }

    if (data.slug) service.slug = data.slug.trim().toLowerCase();
    if (data.description !== undefined) service.description = data.description.trim();
    if (data.icon) service.icon = data.icon.trim();
    if (data.facilityType !== undefined) service.facilityType = data.facilityType;
    if (data.mode !== undefined) service.mode = data.mode;
    if (data.color) service.color = data.color;
    if (data.bgColor) service.bgColor = data.bgColor;
    if (data.borderColor) service.borderColor = data.borderColor;
    if (data.displayOrder !== undefined) service.displayOrder = Number(data.displayOrder);
    if (data.isActive !== undefined) service.isActive = Boolean(data.isActive);

    await service.save();
    return service;
  }

  /**
   * Admin: Toggle Active/Inactive status
   */
  async toggleStatus(id) {
    const service = await HealthcareService.findById(id);
    if (!service) {
      throw new AppError('Healthcare service not found.', 404);
    }
    service.isActive = !service.isActive;
    await service.save();
    return service;
  }

  /**
   * Admin: Safe Delete with dependency check
   */
  async deleteService(id) {
    const service = await HealthcareService.findById(id);
    if (!service) {
      throw new AppError('Healthcare service not found.', 404);
    }

    // If this service maps to a facilityType, check if active facilities reference it
    if (service.facilityType) {
      const facilityCount = await Hospital.countDocuments({ facilityType: service.facilityType });
      if (facilityCount > 0) {
        throw new AppError(
          `This service is currently used by ${facilityCount} registered facilities. Please remove or update those facilities before deleting.`,
          409
        );
      }
    }

    await HealthcareService.findByIdAndDelete(id);
    return { message: 'Healthcare service deleted successfully.' };
  }
}

module.exports = new HealthcareServiceManager();

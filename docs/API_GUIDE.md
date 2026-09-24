# Doctor Booking Application — API Reference Guide

## Server-Side Pagination Standard

All dynamic list endpoints implement standard server-side pagination with uniform query parameters and response structure.

### Request Query Parameters
| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | Integer | `1` | - | Target page number (1-indexed) |
| `limit` | Integer | `10` | `50` | Maximum items returned per page |

### Standard Response Envelope
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "<itemsKey>": [ ... ]
  },
  "pagination": {
    "currentPage": 1,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## 1. Healthcare Facilities API

### Get Facilities (Paginated)
- **Endpoint**: `GET /api/hospitals`
- **Query Params**:
  - `page`: Integer (default: 1)
  - `limit`: Integer (default: 10)
  - `facilityType`: `hospital` | `clinic` | `medical_college` | `speciality_centre` | `polyclinic` | `diagnostic_centre` | `health_centre`
  - `city`: string (optional)
  - `search`: string (optional)
- **Response**:
```json
{
  "success": true,
  "message": "Hospitals retrieved successfully",
  "data": {
    "hospitals": [
      {
        "_id": "60c72b2f9b1d8b2bad9a9999",
        "name": "City Care Hospital",
        "facilityType": "hospital",
        "address": "Opposite Railway Station, Station Road",
        "city": "Kuttippuram",
        "phone": "+91 494 260 8800",
        "rating": 4.8,
        "facilities": ["24x7 Emergency", "ICU", "Diagnostic Lab", "Pharmacy"]
      }
    ]
  },
  "pagination": {
    "currentPage": 1,
    "limit": 10,
    "totalItems": 6,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### Get Facility Details
- **Endpoint**: `GET /api/hospitals/:id`

---

## 2. Doctors API

### Get Doctors (Paginated)
- **Endpoint**: `GET /api/doctors`
- **Query Params**:
  - `page`: Integer (default: 1)
  - `limit`: Integer (default: 10)
  - `homeConsultation`: `true` | `false`
  - `search`: string (doctor name or specialization)
  - `specialization`: string
- **Response**: Paginated list under `data.doctors` with `pagination` metadata.

### Get Doctors by Facility (Paginated)
- **Endpoint**: `GET /api/doctors/hospital/:hospitalId`
- **Query Params**:
  - `page`: Integer (default: 1)
  - `limit`: Integer (default: 10)
- **Response**: Paginated list of doctors practicing at the specified facility.

### Get Doctor Details
- **Endpoint**: `GET /api/doctors/:id`

---

## 3. Schedules & Consultation Fees API

### Get Doctor Schedules (5-day booking window)
- **Endpoint**: `GET /api/schedules/doctor/:doctorId`
- **Query Params**:
  - `hospitalId`: ObjectId (optional)
- **Response**: 5-day bounded schedule list with real-time token states and location-specific consultation fees.

---

## 4. Appointments & Booking API

### Book Appointment
- **Endpoint**: `POST /api/appointments`
- **Body**:
```json
{
  "doctorId": "...",
  "hospitalId": "...",
  "scheduleId": "...",
  "tokenNumber": 3,
  "date": "2026-09-23",
  "patientName": "John Doe",
  "patientAge": 32,
  "patientGender": "male",
  "patientPhone": "+91 98765 43210"
}
```

### Get My Appointments (Paginated)
- **Endpoint**: `GET /api/appointments/my`
- **Query Params**:
  - `page`: Integer (default: 1)
  - `limit`: Integer (default: 10)
  - `status`: `confirmed` | `completed` | `cancelled` (optional)
- **Response**: Paginated appointments list under `data.appointments`.

### Cancel Appointment
- **Endpoint**: `PATCH /api/appointments/:id/cancel`

---

## 5. Notifications API

### Get Notifications (Paginated)
- **Endpoint**: `GET /api/notifications`
- **Query Params**:
  - `page`: Integer (default: 1)
  - `limit`: Integer (default: 10)
- **Response**: Paginated notifications under `data.notifications`.

### Mark Notification as Read
- **Endpoint**: `PATCH /api/notifications/:id/read`

---

## 6. Admin Management APIs (Server-Side Paginated)

All admin dynamic collections support `page` and `limit` query parameters with standard page navigation metadata:

- `GET /api/admin/users?page=1&limit=10&search=...&role=...`
- `GET /api/admin/appointments?page=1&limit=10&status=...&date=...`
- `GET /api/admin/facilities?page=1&limit=10&facilityType=...&search=...`
- `GET /api/admin/doctors?page=1&limit=10&search=...&specialization=...`
- `GET /api/admin/schedules?page=1&limit=10&doctorId=...&facilityId=...&date=...`
- `GET /api/admin/ratings?page=1&limit=10`
- `GET /api/admin/schedules/:scheduleId/waiting-list?page=1&limit=10`

---

## 7. Persistent Image Storage & GridFS API

### Stream Image (Public - Guests & Users)
- **Endpoint**: `GET /api/files/:fileId`
- **Method**: `GET`
- **Access**: Public
- **Headers Returned**:
  - `Content-Type`: `image/jpeg` | `image/png` | `image/webp`
  - `Cache-Control`: `public, max-age=604800` (7 days client cache)
- **Response**: Binary image stream directly from MongoDB GridFS.

### Upload Image (Admin Only)
- **Endpoint**: `POST /api/files/upload`
- **Method**: `POST`
- **Access**: Protected (JWT Bearer + Admin Role Guard)
- **Content-Type**: `multipart/form-data`
- **Form Field**: `image` (Max 5 MB; JPEG, PNG, WEBP)
- **Response**:
```json
{
  "success": true,
  "message": "Image uploaded successfully to GridFS",
  "data": {
    "fileId": "6ab408ff71110616ec060f85",
    "imageUrl": "http://localhost:5000/api/files/6ab408ff71110616ec060f85",
    "filename": "1727110000-doctor.jpg",
    "contentType": "image/jpeg",
    "size": 1048576
  }
}
```

### Delete Image (Admin Only)
- **Endpoint**: `DELETE /api/files/:fileId`
- **Method**: `DELETE`
- **Access**: Protected (JWT Bearer + Admin Role Guard)
- **Response**:
```json
{
  "success": true,
  "message": "Image deleted successfully from storage"
}
```


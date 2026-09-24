# Doctor Booking Application — Architecture & Technical Guide

## 1. System Architecture Overview

The Doctor Booking Application is an end-to-end multi-facility healthcare discovery and appointment scheduling platform. It completely eliminates legacy Government vs Private classification in favor of a clean, unified facility architecture categorized strictly by functional healthcare facility types.

### Facility Architecture
```
Healthcare Facility (Hospital Model)
├── Hospital
├── Clinic
├── Medical College
├── Speciality Centre
├── Polyclinic
├── Diagnostic Centre
└── Health Centre

Primary Consultation Flow:
├── Facility Discovery (FacilityType filters)
└── Home Consultation (Direct Home-Visit Doctor Discovery)
```

---

## 2. Key Data Models & Relationships

### 1. Healthcare Facility (`Hospital` model)
Stores all facilities under a unified collection:
- `name`: String
- `facilityType`: `hospital` | `clinic` | `medical_college` | `speciality_centre` | `polyclinic` | `diagnostic_centre` | `health_centre`
- `image`: URL string
- `description`, `address`, `city`, `phone`, `email`, `workingHours`, `facilities`
- `rating`, `ratingCount`, `isActive`

### 2. Doctor (`Doctor` model)
- `name`, `specialization`, `qualification`, `experience`, `image`, `about`
- `hospitals`: Array of Facility ObjectIds where the doctor practices
- `homeConsultationAvailable`: Boolean flag for direct home consultation availability

### 3. Doctor Schedule (`DoctorSchedule` model)
Supports **different locations with different consultation fees** for the same doctor:
- `doctor`: ObjectId (ref: Doctor)
- `location`: ObjectId (ref: Hospital / Facility)
- `date`: ISO Date string (YYYY-MM-DD)
- `startTime`, `endTime`: String (e.g., "09:00 AM", "01:00 PM")
- `totalTokens`: Number (capacity, e.g., 10 or 15)
- `bookedTokens`: Array of booked token integers
- `consultationFee`: Number (location & schedule specific fee)
- `isAvailable`: Boolean

### 4. Appointment (`Appointment` model)
- `user`: ObjectId (ref: User)
- `doctor`: ObjectId (ref: Doctor)
- `hospital`: ObjectId (ref: Hospital / Facility)
- `schedule`: ObjectId (ref: DoctorSchedule)
- `date`: ISO Date string
- `tokenNumber`: Integer (Queue number)
- `patientName`, `patientAge`, `patientGender`, `patientPhone`
- `consultationFee`: Number (**Historical Snapshot** captured at booking time)
- `status`: `confirmed` | `completed` | `cancelled`

---

## 4. Server-Side Pagination Architecture

To maintain high responsiveness and bounded memory usage as the platform scales:

1. **Uniform Query Extraction & Bounds**:
   - `getPagination(query, defaultLimit, maxLimit)` standardizes pagination parameters.
   - Defaults: `page = 1`, `limit = 10`, `maxLimit = 50`.
   - `skip = (page - 1) * limit`.

2. **Database Engine Execution**:
   - Every paginated query executes in parallel using `Promise.all([Model.find(...).sort(...).skip(skip).limit(limit).lean(), Model.countDocuments(filter)])`.
   - Never load entire datasets into Node.js or mobile client memory.

3. **Client-Side Data Consumption**:
   - **User Mobile Lists**: Handled via `usePaginatedList` hook with `appendMode: true`, `FlatList` `onEndReached`, `onRefresh` pull-to-refresh, and `ListFooterLoader`.
   - **Admin Management Tables**: Handled via `usePaginatedList` with `appendMode: false` and `AdminPagination` control component (`[Previous] Page X of Y (Total: Z) [Next]`).

---

## 5. Persistent Image Storage & Fallback Architecture (MongoDB GridFS)

To provide production-safe image uploads without ephemeral disk data loss or external 3rd-party vendor locking (no Cloudinary):

### 1. Storage Backend — MongoDB GridFS
- **Database Storage**: Image binaries are chunked and stored directly within MongoDB GridFS (`fs.files` and `fs.chunks` collections).
- **Driver**: `mongoose.mongo.GridFSBucket` attached to the active database connection.
- **Persistence Guarantee**: Survives backend restarts, cloud redeployments (e.g. Render/Railway/Heroku ephemeral disks), and multi-device access.
- **Reference in Models**: Normal MongoDB documents (`Doctor`, `Hospital`) store only `imageFileId` (`ObjectId`) and derived `image` URL (`/api/files/:id`).

### 2. Stream-Based Serving & Memory Efficiency
- **Endpoint**: `GET /api/files/:fileId`
- **Streaming**: Images are piped via GridFS download streams directly into the HTTP response (`downloadStream.pipe(res)`) without loading large buffers into Node.js server memory.
- **Public Access**: Guest and unauthenticated users can access image streams.
- **Cache Header**: `Cache-Control: public, max-age=86400` ensures efficient client-side caching.
- **Security**: Upload, replace, and delete endpoints are protected by `authenticate` + `requireAdmin` middleware.

### 3. Universal Fallback & Gender-Aware Placeholders (`AppImage`)
- Universal component `AppImage.js` wraps all image displays across the entire app.
- **Doctor Fallback**:
  - Missing or Broken Image + `male` -> Bundled local Male Doctor icon.
  - Missing or Broken Image + `female` -> Bundled local Female Doctor icon.
  - Missing or Broken Image + `unknown` / other -> Bundled local Generic Doctor icon.
- **Facility Fallback**:
  - Missing or Broken Image -> Bundled local Hospital / Facility icon.
- **Zero Third-Party Fallback URLs**: All fallback avatars and icons are bundled vectors (`@expo/vector-icons`), guaranteeing they render instantly even completely offline.



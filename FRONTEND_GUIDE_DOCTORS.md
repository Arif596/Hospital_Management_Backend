# Hospital Management API — Frontend Guide

Base URL: `http://localhost:4000/api`

This guide covers the **Auth** and **Doctors** APIs.

> Note: The mount paths below are assumed to be `/api/auth` and `/api/doctors`.
> If `app.js` / `server.js` uses different paths, update them here.

---
## Key Concepts
- Protected routes require this header:
  `Authorization: Bearer <token>`
  (If the backend uses cookies instead, set `withCredentials: true`.)
- Creating, updating and deleting a doctor is **admin only**.
- Listing doctors and fetching a single doctor are **public** (no token needed).
- When a doctor is created, the backend also creates a linked `User` account (role `doctor`).
- Create and update doctor use **`multipart/form-data`** because of the image upload.
- In multipart requests every value is a string, so:
  - Send `fee` and `experience` as number strings (`"500"`). The backend converts them.
  - Send `availableDays` and `timeSlots` as **JSON strings** (see examples below).
- `:id` is the MongoDB `_id` of the **doctor**, not the user.

---

## Auth Endpoints

Base path: `/api/auth`

### 1. Register

```
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Ali Khan",
  "email": "ali@example.com",
  "password": "secret123"
}
```

> Confirm the exact body against `authController.js`.

### 2. Login

```
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@example.com",
  "password": "secret123"
}
```

The response contains a token. Store it and send it on protected requests.

### 3. Get current user

```
GET /api/auth/me
Authorization: Bearer <token>
```

---

## Doctor Endpoints

Base path: `/api/doctors`

### 1. List doctors (public)

```
GET /api/doctors
GET /api/doctors?specialization=cardio
```

`specialization` is a partial, case-insensitive match.

Response:

```json
{
  "success": true,
  "count": 1,
  "doctors": [
    {
      "_id": "665f1c...",
      "user": { "_id": "665f1b...", "name": "Dr. Sara", "email": "sara@example.com" },
      "specialization": "Cardiologist",
      "fee": 1500,
      "experience": 8,
      "availableDays": ["Mon", "Wed"],
      "timeSlots": ["09:00-10:00", "10:00-11:00"],
      "phone": "03001234567",
      "bio": "...",
      "image": { "url": "https://res.cloudinary.com/...", "publicId": "doctors/abc" }
    }
  ]
}
```

### 2. Get single doctor (public)

```
GET /api/doctors/{id}
```

Response:

```json
{ "success": true, "doctor": { "...same shape as above..." } }
```

Returns `404` if the doctor does not exist.

### 3. Create doctor (admin only)

```
POST /api/doctors
Authorization: Bearer <admin token>
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | min 2 characters |
| `email` | string | Yes | valid email, must be unique |
| `password` | string | Yes | min 6 characters |
| `specialization` | string | Yes | min 2 characters |
| `fee` | number | Yes | positive number |
| `experience` | number | No | 0 or more |
| `phone` | string | No | |
| `bio` | string | No | |
| `availableDays` | JSON string | No | `["Mon","Tue","Wed"]` |
| `timeSlots` | JSON string | No | `["09:00-10:00","10:00-11:00"]` |
| `image` | file | No | field name must be exactly `image` |

Valid `availableDays` values: `Mon, Tue, Wed, Thu, Fri, Sat, Sun`

Response `201`:

```json
{ "success": true, "doctor": { "...doctor object..." } }
```

Frontend example (fetch):

```js
const fd = new FormData();
fd.append("name", "Dr. Sara");
fd.append("email", "sara@example.com");
fd.append("password", "secret123");
fd.append("specialization", "Cardiologist");
fd.append("fee", 1500);
fd.append("availableDays", JSON.stringify(["Mon", "Wed"]));
fd.append("timeSlots", JSON.stringify(["09:00-10:00"]));
fd.append("image", fileInput.files[0]);

await fetch("/api/doctors", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` }, // do NOT set Content-Type manually
  body: fd,
});
```

> Do not set `Content-Type` manually. The browser adds it with the correct boundary.

### 4. Update doctor (admin only)

```
PUT /api/doctors/{id}
Authorization: Bearer <admin token>
Content-Type: multipart/form-data
```

Only these fields can be changed (all optional, only the ones you send are updated):

`specialization`, `fee`, `experience`, `phone`, `bio`, `availableDays`, `timeSlots`, `image`

> `name`, `email` and `password` **cannot** be changed through this route.

Sending a new `image` deletes the old Cloudinary image after the new one is saved.

Response:

```json
{ "success": true, "doctor": { "...updated doctor..." } }
```

### 5. Delete doctor (admin only)

```
DELETE /api/doctors/{id}
Authorization: Bearer <admin token>
```

This deletes the doctor profile, the linked `User` account and the Cloudinary image. It cannot be undone, so always show a confirmation dialog in the UI.

Response:

```json
{ "success": true, "message": "Doctor deleted" }
```

---

## Typical Flows

### Admin adds a doctor

```
1. POST /api/auth/login        -> admin token
2. POST /api/doctors           -> create doctor (multipart)
3. GET  /api/doctors           -> refresh list
```

### Change a doctor's image

```
1. PUT /api/doctors/{id}       -> send only `image` (multipart)
```

### Delete a doctor

```
1. DELETE /api/doctors/{id}    -> after user confirms
2. GET    /api/doctors         -> refresh list
```

### Patient browses doctors

```
1. GET /api/doctors?specialization=...   -> no token needed
2. GET /api/doctors/{id}                 -> detail page
```

---

## Roles

| Role | Access |
|---|---|
| `admin` | Create, update, delete doctors |
| `doctor` | Can log in (account created by admin) |
| `patient` | Register/login, browse doctors |

---

## Error Responses

Generic format:

```json
{ "success": false, "message": "Doctor not found" }
```

| Status | Meaning |
|---|---|
| 400 | Validation failed (invalid field value), or email already registered |
| 401 | Token missing or invalid |
| 403 | Role not allowed (not an admin) |
| 404 | Doctor not found |

For `400`, `message` contains the first validation error, for example `Too small: expected string to have >=6 characters`. You can show this message in the UI.

---

## Common Mistakes

- Sending `availableDays` as `Mon,Tue`. The correct format is a JSON string: `["Mon","Tue"]`.
- Using a field name other than `image` for the file. The upload will be ignored or rejected.
- Setting `Content-Type: application/json` on a multipart request.
- Calling create, update or delete without an admin token (`401` / `403`).



<!--  Appointment flow -->
Appointment Endpoints

Base path: /api/appointments

All appointment routes require login (Authorization: Bearer <token>).

Appointment status lifecycle
pending  ──►  confirmed  ──►  completed
   │              │
   └──────────────┴────►  cancelled
A new appointment always starts as pending.
Approve = set status to confirmed (done by doctor or admin).
completed and cancelled are final. They cannot be changed again.
A slot stays blocked while the appointment is pending or confirmed. If cancelled, the slot becomes free again.
1. Book an appointment (patient only)
POST /api/appointments
Authorization: Bearer <patient token>
Content-Type: application/json
json
{
  "doctorId": "665f1c0a2b3c4d5e6f7a8b9c",
  "date": "2026-11-05",
  "timeSlot": "09:00-10:00",
  "reason": "Chest pain and shortness of breath"
}
Field	Type	Required	Notes
doctorId	string	Yes	Doctor _id (24 chars), not the user id
date	string	Yes	Format YYYY-MM-DD, cannot be in the past
timeSlot	string	Yes	Must exactly match one of the doctor’s timeSlots
reason	string	No	

The date must fall on one of the doctor’s availableDays. Use GET /api/doctors/{id} to show only valid days and slots in the UI.

Response 201:

json
{
  "success": true,
  "appointment": {
    "_id": "6ae49de8661e9f226ce8d24e",
    "patient": "665f1b...",
    "doctor": "665f1c...",
    "date": "2026-11-05",
    "timeSlot": "09:00-10:00",
    "reason": "Chest pain and shortness of breath",
    "status": "pending"
  }
}

Frontend example:

js
const res = await fetch("/api/appointments", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ doctorId, date, timeSlot, reason }),
});
const data = await res.json();
2. Get my appointments (patient)
GET /api/appointments/my
Authorization: Bearer <patient token>

Sorted by date, newest first. The doctor is populated with the doctor’s name.

json
{
  "success": true,
  "count": 1,
  "appointments": [
    {
      "_id": "6ae49d...",
      "doctor": {
        "_id": "665f1c...",
        "specialization": "Cardiologist",
        "user": { "_id": "665f1b...", "name": "Dr. Sara" }
      },
      "date": "2026-11-05",
      "timeSlot": "09:00-10:00",
      "status": "pending"
    }
  ]
}
3. Get appointments of the logged-in doctor
GET /api/appointments/doctor
Authorization: Bearer <doctor token>

Sorted by date, then time slot (earliest first). Each appointment includes the patient’s name and email.

json
{
  "success": true,
  "count": 1,
  "appointments": [
    {
      "_id": "6ae49d...",
      "patient": { "_id": "665f1a...", "name": "Ali Khan", "email": "ali@example.com" },
      "doctor": "665f1c...",
      "date": "2026-11-05",
      "timeSlot": "09:00-10:00",
      "reason": "Chest pain",
      "status": "pending"
    }
  ]
}

Returns 404 if the logged-in doctor has no doctor profile.

4. Get all appointments (admin only)
GET /api/appointments
Authorization: Bearer <admin token>

Sorted by newest created first. Includes patient (name, email) and doctor (with user.name).

5. Approve / complete / cancel (change status)
PATCH /api/appointments/{id}/status
Authorization: Bearer <token>
Content-Type: application/json

:id is the appointment _id.

json
{
  "status": "confirmed",
  "notes": "Please arrive 10 minutes early"
}
Field	Type	Required	Notes
status	string	Yes	Exactly one of confirmed, completed, cancelled (lowercase)
notes	string	No	Saved only when sent by a doctor or admin (ignored for patients)

Who can do what:

Role	Allowed
patient	Only cancel their own appointment (cancelled)
doctor	Approve (confirmed), completed, or cancelled on their own appointments only
admin	Any status change on any appointment

Response:

json
{ "success": true, "appointment": { "...updated appointment..." } }

Frontend examples:

js
// Doctor approves
await fetch(`/api/appointments/${id}/status`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ status: "confirmed" }),
});

// Patient cancels
body: JSON.stringify({ status: "cancelled" })

Always send a JSON body with Content-Type: application/json. Without a body the server returns a 500 error.

Appointment Flows
Patient books an appointment
1. GET  /api/doctors/{id}            -> show availableDays + timeSlots
2. POST /api/appointments            -> book (status = pending)
3. GET  /api/appointments/my         -> show in "My appointments"
Doctor approves an appointment
1. GET   /api/appointments/doctor        -> list (filter status = pending)
2. PATCH /api/appointments/{id}/status   -> { "status": "confirmed" }
3. GET   /api/appointments/doctor        -> refresh list
Doctor completes a visit
1. PATCH /api/appointments/{id}/status   -> { "status": "completed", "notes": "..." }
Patient cancels
1. PATCH /api/appointments/{id}/status   -> { "status": "cancelled" }
2. GET   /api/appointments/my            -> refresh list
Admin overview
1. GET /api/appointments                 -> all appointments
Appointment Error Responses
Status	Message	Meaning
400	Invalid doctor id / Date format must be YYYY-MM-DD	Validation failed
400	Cannot book an appointment in the past	Date is before today
400	Doctor is not available on Mon	Doctor does not work that weekday
400	Invalid slot. Available: ...	timeSlot not in the doctor’s slots
400	Status must be confirmed, completed or cancelled	Invalid status value
400	Appointment is already completed / cancelled	Final status, cannot change
401	Token missing or invalid	Login required
403	Patients can only cancel their own appointments	Patient tried something else
403	This is not your appointment	Doctor touching another doctor’s appointment
404	Appointment not found	Wrong appointment id
409	This slot is already booked	Another pending/confirmed booking exists
Appointment Common Mistakes
Using approved / Confirmed as status. Use lowercase confirmed.
Sending userId instead of the doctor _id in doctorId.
Sending timeSlot in a different format than the doctor’s slots (e.g. 9-10 instead of 09:00-10:00).
Calling the status route without a JSON body.
Using the doctor token on /my (patient only) or the patient token on /doctor (doctor only), which returns 403.
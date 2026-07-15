# AussieMate — Flutter API Documentation

> Base URL: `https://api.aussiemate.com.au/api`
> All authenticated requests require: `Authorization: Bearer <token>`

---

## 1. Cleaner — Contact Customer (Accept Job)

**POST** `/jobs/:jobId/contact`

> Cleaner accepts a job from the feed/details. **No credits deducted yet.**
> Credits are deducted only when the customer accepts.

**Headers:**
```
Authorization: Bearer <cleaner_token>
Content-Type: application/json
```

**Body:**
```json
{
  "message": "Hi, I am interested in this job! Let's connect.",
  "price": 150
}
```

**Response — Direct Contact:**
```json
{
  "success": true,
  "data": {
    "_id": "chatRoomId",
    "isConnected": false
  },
  "message": "Contact initiated successfully. Waiting for customer to accept."
}
```

---

## 2. Customer — Accept Cleaner ⚡ (Credits Cut Here!)

**POST** `/jobs/:jobId/connect/:cleanerId`

> Customer accepts cleaner. **This is where cleaner credits are deducted!**
> `isConnected` becomes `true` — chat unlocks.

**Headers:**
```
Authorization: Bearer <customer_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully connected with the cleaner.",
  "chatRoomId": "chatRoomId"
}
```

---

## 3. Customer — Decline/Reject Cleaner

**POST** `/quotes/:jobId/reject/:cleanerId`

> Customer declines a cleaner. No credits deducted.

**Response:**
```json
{
  "success": true,
  "message": "Cleaner declined successfully."
}
```

---

## 4. Get Job Details

**GET** `/jobs/:jobId`

**Key fields in response:**
```json
{
  "success": true,
  "data": {
    "_id": "jobId",
    "status": "posted",
    "contactedCleaners": [
      {
        "cleanerId": { "_id": "id", "firstName": "John" },
        "status": "pending"
      }
    ],
    "waitlistedCleaners": []
  }
}
```

---

## Credit Flow logic for Mobile:

1. **Cleaner's view of Job Feed/Details:**
   - If not applied: show `[Reject]` and `[Accept]` buttons.
   - Click `Accept` → Calls `/jobs/:jobId/contact` → Redirect to Chat (waiting state).
   - If applied: show `[Chat]` button.

2. **Customer's view of Job Details:**
   - If quote status is `pending` and `isConnected` is `false`: show `[Reject]` and `[Accept]` buttons.
   - Click `Accept` → Calls `/jobs/:jobId/connect/:cleanerId` (deducts credits from cleaner) → Opens chat.
   - Click `Reject` → Calls `/quotes/:jobId/reject/:cleanerId` → Hides/shows Rejected.

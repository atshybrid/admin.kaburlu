# Modern Tenant Management System - Documentation

## Overview
Complete redesign of the tenant overview pages and tables with clean, modern UI components that integrate with the backend APIs.

## Features Implemented

### 1. **States API Service** (`lib/api/services/statesApi.js`)
- Fetches list of all Indian states from the backend
- Used in tenant creation dropdown
- API Endpoint: `GET /api/v1/states`
- Returns: Array of states with id and name

```javascript
import { statesApi } from '../../../lib/api/services/statesApi'

// Usage
const states = await statesApi.list()
```

### 2. **Create Tenant Modal** (`components/admin/modals/CreateTenantModal.jsx`)
- Clean, modern modal with form validation
- **Auto-slug generation**: Automatically creates URL-friendly slug from tenant name
- **State dropdown**: Fetches and displays all states
- **Required fields**: Name and State
- **Optional fields**: PRGI Number
- Real-time slug preview
- Error handling with user-friendly messages

#### Form Fields:
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Tenant Name | ✅ Yes | Text | Full name of the publication |
| PRGI Number | ❌ No | Text | Press Registration number |
| State | ✅ Yes | Dropdown | Select from all Indian states |
| Slug | Auto-generated | Text | Auto-created from name (not editable) |

#### API Integration:
```javascript
POST /api/v1/tenants
{
  "name": "PRASHNA AYUDHAM",
  "slug": "prashna-ayudham",  // Auto-generated
  "prgiNumber": "TGTEL/25/A0482",
  "stateId": "cmk74ho02002rugy45x85vvi7"
}
```

### 3. **Tenants List Page** (`pages/admin/tenants/index.js`)
- Modern, responsive data table
- Real-time search by name, slug, PRGI number, or state
- Status badges for PRGI verification status
- Clean empty states
- Loading states with spinner
- Error handling with retry button

#### Table Columns:
1. **Tenant** - Name and slug
2. **State** - Associated state name
3. **PRGI Number** - Registration number
4. **Status** - PRGI verification badge
5. **Created** - Creation date
6. **Actions** - View Details link

#### Features:
- ✅ Search tenants in real-time
- ✅ Create new tenant with modal
- ✅ Navigate to tenant detail page
- ✅ Responsive design
- ✅ Empty state for no tenants
- ✅ Error handling

### 4. **Tenant Overview Page** (`pages/admin/tenants/[id]/new-overview.js`)
- Card-based layout showing all tenant information
- Clean, organized sections
- Responsive 3-column grid (2 main + 1 sidebar)

#### Sections:
1. **Basic Information**
   - Tenant Name
   - Slug
   - State
   - PRGI Number
   - PRGI Status

2. **PRGI Details**
   - Submitted At
   - Verified At
   - Rejected At
   - Rejection Reason (if any)

3. **Timestamps**
   - Created At
   - Updated At

4. **Sidebar**
   - Quick Actions (Edit, Settings, View Entity)
   - Tenant ID (copyable)
   - State Details

## UI Components Used

### From `components/ui/`:
- **Modal**: Reusable modal component
- **Button**: Styled button with variants (primary, ghost, outline)
- **Spinner**: Loading indicator
- **EmptyState**: No data placeholder
- **Badge**: Status indicators with color variants
- **Card**: Container for grouped content

### Badge Variants:
| Status | Variant | Color |
|--------|---------|-------|
| VERIFIED | success | Green |
| ACTIVE | success | Green |
| PENDING | warning | Yellow |
| REJECTED | danger | Red |
| INACTIVE | default | Gray |

## API Endpoints

### 1. Get States
```bash
GET /api/v1/states
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cmk74ho02002rugy45x85vvi7",
      "name": "Telangana",
      "countryId": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### 2. Create Tenant
```bash
POST /api/v1/tenants
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "PRASHNA AYUDHAM",
  "slug": "prashna-ayudham",
  "prgiNumber": "TGTEL/25/A0482",
  "stateId": "cmk74ho02002rugy45x85vvi7"
}
```

**Response:**
```json
{
  "id": "cmkh94g0s01eykb21toi1oucu",
  "name": "PRASHNA AYUDHAM",
  "slug": "prashna-ayudham",
  "stateId": "cmk74ho02002rugy45x85vvi7",
  "prgiNumber": "TGTEL/25/A0482",
  "prgiStatus": "PENDING",
  "createdAt": "2026-01-16T19:08:25.756Z",
  "updatedAt": "2026-01-16T19:08:25.756Z"
}
```

### 3. Get Tenants List
```bash
GET /api/v1/tenants?full=true
Authorization: Bearer <token>
```

### 4. Get Tenant Details
```bash
GET /api/v1/tenants/:id
Authorization: Bearer <token>
```

## File Structure

```
admin-dashboard/
├── components/
│   ├── admin/
│   │   └── modals/
│   │       └── CreateTenantModal.jsx      # Tenant creation modal
│   └── ui/
│       ├── Modal.jsx
│       ├── Button.jsx
│       ├── Spinner.jsx
│       ├── EmptyState.jsx
│       ├── Badge.jsx
│       └── Card.jsx
├── lib/
│   └── api/
│       ├── services/
│       │   └── statesApi.js               # States API service
│       └── tenantApi.js                    # Tenant API service
└── pages/
    └── admin/
        └── tenants/
            ├── index.js                     # Tenants list page
            └── [id]/
                └── new-overview.js          # Tenant detail page
```

## Usage Guide

### Creating a New Tenant

1. Navigate to `/admin/tenants`
2. Click "Create Tenant" button
3. Fill in the form:
   - Enter tenant name (e.g., "PRASHNA AYUDHAM")
   - (Optional) Enter PRGI number (e.g., "TGTEL/25/A0482")
   - Select state from dropdown
   - Note: Slug is auto-generated (no input needed)
4. Click "Create Tenant"
5. Automatically redirected to tenant detail page

### Viewing Tenant Details

1. From tenants list, click "View Details" on any tenant
2. View all tenant information organized in cards
3. Use quick actions in sidebar for common tasks

### Searching Tenants

- Use the search bar on tenants list page
- Search works across: name, slug, PRGI number, and state
- Results update in real-time

## Design Principles

1. **Clean & Modern**: Minimalist design with proper spacing
2. **User-Friendly**: Auto-generation of slug, clear labels
3. **Responsive**: Works on all screen sizes
4. **Error Handling**: Clear error messages with recovery options
5. **Loading States**: Proper loading indicators
6. **Empty States**: Helpful messages when no data exists

## Next Steps for E-Paper Integration

To extend this to e-paper management, you'll need to add:

1. **E-Paper Editions API Service**
   - Create endpoints for managing editions
   - Link editions to tenants

2. **E-Paper Management UI**
   - Edition creation modal
   - Edition list/table
   - Upload interface for PDF files

3. **Tenant Detail Tabs**
   - Add "E-Paper" tab to tenant detail page
   - Show editions for specific tenant
   - Manage issues and uploads

Would you like me to continue with the e-paper integration next?

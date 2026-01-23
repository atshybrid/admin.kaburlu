# Article Management System - Role-Based Access Control

## Overview
The article management system now supports role-based access with clean, intuitive UIs tailored to each user type.

## User Roles

### 1. Super Admin
- **Full Access**: Can manage all tenants, users, settings, and content
- **Tenant Selection**: Must select tenant before creating articles
- **Navigation**: Full admin menu with all sections
- **Layout**: `SuperAdminLayout` with complete sidebar navigation

### 2. Tenant Admin  
- **Tenant-Scoped**: Automatically uses their assigned tenant
- **Articles Only**: Can only access article management
- **Navigation**: Simplified menu showing only article pages
- **Layout**: `ReporterLayout` with minimal, focused navigation

### 3. Reporter
- **Tenant-Scoped**: Automatically uses their assigned tenant
- **Articles Only**: Can create and view articles
- **Navigation**: Simplified menu showing only article pages
- **Layout**: `ReporterLayout` with minimal, focused navigation

## Features

### Article Creation (`/admin/articles/create`)

#### For Super Admin:
1. Tenant selection dropdown (required)
2. Load categories and languages based on selected tenant
3. Full article form with all fields
4. Image upload capability
5. Status selection (Draft, Published, Scheduled)

#### For Tenant Admin & Reporter:
1. Automatic tenant detection from user profile
2. Categories and languages auto-loaded for their tenant
3. Same article form without tenant selector
4. Image upload capability
5. Status selection (Draft, Published, Scheduled)

### Navigation Structure

#### Super Admin Navigation:
```
Main Menu
  ├─ Overview
  ├─ All Articles
  ├─ Create Article
  ├─ Reporters
  ├─ Categories
  ├─ Languages
  └─ Users

Locations
  ├─ States
  ├─ Districts
  ├─ Assembly Constituencies
  └─ Mandals

Tenant Management
  ├─ All Tenants
  ├─ ID Card Settings
  ├─ Razorpay Settings
  └─ Domain Settings

Settings
  ├─ Roles & Permissions
  └─ Global Razorpay
```

#### Tenant Admin & Reporter Navigation:
```
Article Menu
  ├─ All Articles
  └─ Create Article
```

## Files Created/Modified

### New Files:
1. **`lib/api/services/articleService.js`**
   - Article CRUD operations
   - Role-based tenant handling
   - Image upload support

2. **`components/dashboard/PostArticle.jsx`**
   - Clean article creation form
   - Conditional tenant selector for super admin
   - Real-time validation
   - Image preview

3. **`components/dashboard/ReporterLayout.jsx`**
   - Simplified layout for Tenant Admin and Reporter
   - Article-focused navigation
   - Mobile responsive
   - Clean, modern design

4. **`pages/admin/articles/create.js`**
   - Role-based layout routing
   - Access control
   - Success/error handling

5. **`utils/roleUtils.js`**
   - Centralized role management
   - Role detection helpers
   - Access control utilities

### Modified Files:
1. **`lib/api/client.js`**
   - Added `upload()` method for file uploads

2. **`components/dashboard/ModernSidebar.jsx`**
   - Added "Create Article" navigation item
   - Updated article access roles to include Tenant Admin and Reporter

3. **`pages/admin/articles.js`**
   - Role-based layout selection
   - Access control validation

## Usage Examples

### Creating an Article as Super Admin:
```javascript
// 1. Navigate to /admin/articles/create
// 2. Select tenant from dropdown
// 3. Fill in article details
// 4. Upload image (optional)
// 5. Click "Create Article"
```

### Creating an Article as Reporter:
```javascript
// 1. Navigate to /admin/articles/create
// 2. Tenant is automatically selected
// 3. Fill in article details
// 4. Upload image (optional)
// 5. Click "Create Article"
```

## API Integration

### Article Service Methods:
```javascript
import { articleService } from 'lib/api/services/articleService'

// Create article
await articleService.create({
  tenantId: 'tenant-123',
  title: 'Article Title',
  content: 'Article content...',
  categoryId: 'cat-456',
  languageCode: 'te',
  tags: 'news, politics',
  imageUrl: 'https://...',
  status: 'DRAFT'
})

// List articles
await articleService.list('tenant-123', { page: 1, limit: 20 })

// Upload image
await articleService.uploadImage('tenant-123', fileObject)
```

### Role Utilities:
```javascript
import { 
  isSuperAdmin, 
  isTenantAdmin, 
  isReporter,
  hasArticleAccess,
  getUserTenantId 
} from 'utils/roleUtils'

// Check roles
if (isSuperAdmin(user)) {
  // Show tenant selector
}

// Get tenant ID
const tenantId = getUserTenantId(user)
```

## Security

### Access Control:
- All pages check authentication on mount
- Role validation before rendering content
- Tenant ID validation for scoped operations
- Redirect to home if unauthorized

### API Security:
- JWT token in Authorization header
- Backend validates tenant access per user
- Reporter can only create articles for their tenant
- Super admin can create for any tenant

## UI/UX Best Practices

### Clean Design:
- ✅ Minimal, focused navigation for reporters
- ✅ Clear visual hierarchy
- ✅ Consistent color scheme (brand gradient)
- ✅ Responsive mobile design
- ✅ Loading states and error handling
- ✅ Success feedback messages

### User Experience:
- ✅ Auto-fill tenant for non-admin users
- ✅ Real-time form validation
- ✅ Image preview before upload
- ✅ Keyboard-friendly forms
- ✅ Clear action buttons
- ✅ Breadcrumb-style navigation

## Future Enhancements

### Potential Features:
- [ ] Article preview before publishing
- [ ] Draft auto-save
- [ ] Rich text editor integration
- [ ] Bulk image upload
- [ ] Article scheduling
- [ ] Article templates
- [ ] Collaborative editing
- [ ] Article analytics
- [ ] SEO optimization tools
- [ ] Multi-language content management

## Testing Checklist

### Super Admin:
- [ ] Can access /admin/articles/create
- [ ] Sees tenant selector
- [ ] Can select different tenants
- [ ] Categories/languages load per tenant
- [ ] Can create article successfully
- [ ] Redirected to articles list after creation

### Tenant Admin:
- [ ] Can access /admin/articles/create
- [ ] No tenant selector shown
- [ ] Tenant auto-detected
- [ ] Categories/languages load automatically
- [ ] Can create article successfully
- [ ] Only sees article pages in navigation

### Reporter:
- [ ] Can access /admin/articles/create
- [ ] No tenant selector shown
- [ ] Tenant auto-detected
- [ ] Categories/languages load automatically
- [ ] Can create article successfully
- [ ] Only sees article pages in navigation
- [ ] Cannot access admin features

## Support

For issues or questions:
1. Check role assignment in user profile
2. Verify tenant ID is set for Tenant Admin/Reporter
3. Ensure categories and languages exist for tenant
4. Check browser console for API errors
5. Verify JWT token is valid

---

**Last Updated**: January 22, 2026
**Version**: 1.0
**Author**: Kaburlu Development Team

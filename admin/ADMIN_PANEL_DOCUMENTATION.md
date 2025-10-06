# Admin Panel Documentation

## Overview
The TWS Vision Admin Panel is a modern, responsive web interface for managing users, tasks, withdrawals, and platform settings. Built with HTML, CSS, and JavaScript, it provides real-time management capabilities with a professional gradient-based UI.

## Features

### 🏠 Dashboard
- **Statistics Overview**: Real-time display of total users, active tasks, pending withdrawals, and conversion ratio
- **Quick Actions**: Direct access buttons to all major sections
- **Visual Cards**: Color-coded statistics with icons for easy understanding

### 👥 User Management
- **Complete User Table**: View all users with comprehensive details
- **Advanced Search**: Three-way search functionality:
  - Search by User ID
  - Search by Username  
  - Search by Wallet Address
- **Real-time Filtering**: Instant results as you type
- **User Details**: Click to view complete user information
- **Data Displayed**:
  - User ID
  - Username
  - Wallet Address (truncated for readability)
  - Total Points (MTWS)
  - TWS Balance
  - Total Referrals
  - Action buttons

### 📋 Task Management
- **Two-Section Layout**:
  - **Current Tasks**: View and manage existing tasks
  - **Add New Task**: Create new tasks with image upload
- **Task Operations**:
  - View task details with images
  - Delete tasks with confirmation
  - Add new tasks with title, reward, link, and image
- **Real-time Updates**: Changes reflect immediately

### 💰 Withdrawal Management
- **Withdrawal Settings**:
  - Display current minimum withdrawal limit
  - Update withdrawal limit for all users
- **Pending Requests Table**:
  - Request ID
  - User ID
  - Amount (TWS)
  - Wallet Address (truncated)
  - Process button
- **Withdrawal Processing**:
  - One-click processing with confirmation
  - Automatically resets user's TWS balance to 0
  - Removes request from pending list

### ⚙️ Configuration Management
- **Conversion Ratio**:
  - Display current MTWS to TWS ratio
  - Update ratio for all conversions
- **Exchange Rates Management**:
  - View all TWS ↔ TON exchange rates
  - Add new exchange rates
  - Edit existing rates inline
  - Delete rates with confirmation
  - Real-time preview of changes

## Setup Instructions

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Backend server running (see Backend Documentation)
- No additional software installation required

### Environment Configuration
Create `.env` file in admin folder:
```env
# API Configuration
API_BASE_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000

# Production URLs (update for production)
PRODUCTION_API_URL=https://your-backend-domain.com
PRODUCTION_BACKEND_URL=https://your-backend-domain.com

# Admin Panel Configuration
ADMIN_TITLE=TWS Vision Admin Panel
ADMIN_VERSION=1.0.0
```

### Quick Start
1. **Start Backend Server** (see Backend Documentation)
2. **Open Admin Panel**:
   - Option 1: Direct file opening
     ```
     Open admin/index.html in your browser
     ```
   - Option 2: Local server
     ```bash
     cd admin
     python -m http.server 8080
     # Then visit http://localhost:8080
     ```

### Production Deployment
1. **Upload Files**: Upload `admin/` folder to your web server
2. **Update API URL**: Edit `admin.js` line 2:
   ```javascript
   const API_URL = 'https://your-backend-domain.com';
   ```
3. **Configure Web Server**: Ensure proper CORS headers if needed

## User Guide

### Dashboard Usage
1. **View Statistics**: Dashboard loads automatically with current data
2. **Quick Navigation**: Use colored action buttons for fast access
3. **Real-time Updates**: Statistics update when you visit other pages

### Managing Users
1. **Search Users**:
   - Type in any search box to filter results
   - Multiple search terms work together
   - Clear search boxes to show all users
2. **View User Details**:
   - Click the eye icon next to any user
   - View complete user information in popup
3. **User Data**:
   - All user data is read-only for safety
   - Updates must be done through backend API

### Managing Tasks
1. **View Current Tasks**:
   - All active tasks displayed with images
   - Click external link icon to visit task URL
   - See reward amount for each task
2. **Delete Tasks**:
   - Click trash icon on any task
   - Confirm deletion in popup
   - Task removed immediately
3. **Add New Tasks**:
   - Fill in task title (required)
   - Enter reward amount in MTWS (required)
   - Add task URL (required)
   - Upload task image (required)
   - Click "Add Task" button
   - Task appears in list immediately

### Processing Withdrawals
1. **Update Withdrawal Limit**:
   - Enter new minimum TWS amount
   - Click "Update Limit" button
   - Affects all future withdrawal requests
2. **Process Withdrawals**:
   - View all pending requests in table
   - Click "Done" button for any request
   - Confirm action (this resets user balance!)
   - Request removed from list
   - User's TWS balance set to 0

### Managing Settings
1. **Update Conversion Ratio**:
   - Enter new ratio (e.g., 1000 = 1000:1)
   - Click "Update Ratio" button
   - Affects all MTWS to TWS conversions
2. **Manage Exchange Rates**:
   - **Add**: Enter TWS and TON amounts, click "Add Rate"
   - **Edit**: Click pencil icon, enter new values
   - **Delete**: Click trash icon, confirm deletion
   - All changes reflect immediately

## Technical Details

### Browser Compatibility
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers

### Performance
- **Fast Loading**: Optimized JavaScript and CSS
- **Efficient API Calls**: Only loads data when needed
- **Real-time Updates**: Instant UI updates
- **Responsive Design**: Works on all screen sizes

### Security Features
- **Input Validation**: All forms validate input
- **Confirmation Dialogs**: Prevent accidental actions
- **Error Handling**: Graceful error messages
- **No Data Storage**: All data fetched from backend

## Customization

### Changing Colors
Edit CSS variables in `index.html`:
```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --success-color: #4facfe;
  --danger-color: #f5576c;
}
```

### Adding Features
1. **New API Endpoint**: Add function in `admin.js`
2. **New UI Section**: Add HTML in `index.html`
3. **New Page**: Add navigation item and page content

### Styling Modifications
- Uses Tailwind CSS for rapid styling
- Custom CSS for gradients and animations
- Font Awesome icons throughout
- Responsive grid system

## Troubleshooting

### Common Issues

#### Data Not Loading
1. **Check Backend**: Ensure backend server is running
2. **Check Console**: Open browser console (F12) for errors
3. **Check Network**: Verify API calls in Network tab
4. **Check CORS**: Ensure backend allows frontend domain

#### Search Not Working
1. **Clear Search**: Clear all search boxes
2. **Check Data**: Ensure users are loaded
3. **Refresh Page**: Reload admin panel

#### Images Not Uploading
1. **Check Backend**: Verify `static/images` folder exists
2. **Check Permissions**: Ensure backend can write files
3. **Check File Type**: Only image files accepted

### Error Messages
- **"Error loading..."**: Backend connection issue
- **"Failed to..."**: API endpoint error
- **"Please enter..."**: Input validation error

## Maintenance

### Regular Tasks
1. **Monitor Backend**: Ensure backend server is running
2. **Check Logs**: Review backend logs for errors
3. **Update Data**: Regular database backups
4. **Test Features**: Periodically test all functions

### Updates
1. **Backup Files**: Always backup before updates
2. **Test Changes**: Test in development first
3. **Update Documentation**: Keep docs current
4. **Notify Users**: Inform team of changes

## Support

### For Developers
- Check browser console for JavaScript errors
- Verify API endpoints are working
- Test with different browsers
- Check network connectivity

### For Administrators
- Follow user guide step-by-step
- Use confirmation dialogs carefully
- Backup data before major changes
- Contact development team for issues

## Future Enhancements

### Planned Features
- User authentication/login system
- Bulk operations for users
- Data export functionality
- Advanced analytics dashboard
- Activity logging
- Email notifications
- Dark mode toggle
- Data visualization charts

### Customization Options
- Custom branding and colors
- Additional user fields
- Custom task types
- Advanced withdrawal rules
- Multi-language support

---

**Version**: 1.0.0  
**Last Updated**: Current Date  
**Compatibility**: Backend API v1.0+


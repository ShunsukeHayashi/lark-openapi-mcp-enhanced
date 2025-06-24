# 🚀 Lark MCP Tool - Create Base Example

This guide shows you how to use the Lark MCP Tool to create Base applications and manage databases.

## 🎯 Quick Start - Create a Base Application

### Method 1: Using Cursor AI Chat

Once you have the Lark MCP tool configured in Cursor, you can simply ask:

```
"Create a new Lark Base application called 'Project Management System'"
```

### Method 2: Using CLI Directly

```bash
# Navigate to the project directory
cd /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp

# Create a Base application using the MCP tool
node dist/cli.js mcp --config config-larksuite-corrected.json --mode stdio
```

Then send this JSON-RPC request:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "bitable_v1_app_create",
    "arguments": {
      "data": {
        "name": "Project Management System",
        "folder_token": "",
        "time_zone": "Asia/Tokyo"
      },
      "useUAT": true
    }
  }
}
```

### Method 3: Using the Genesis Agent

```bash
# Generate a complete system design
python3 test-genesis.py

# This will create both CMS and SFA system designs
# with detailed execution plans for Base creation
```

## 🏗️ Complete Base Creation Workflow

### Step 1: Create the Base Application
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "bitable_v1_app_create",
    "arguments": {
      "data": {
        "name": "Project Management System",
        "description": "Complete project management solution with tasks, team members, and milestones"
      },
      "useUAT": true
    }
  }
}
```

### Step 2: Create Tables
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "bitable_v1_appTable_create",
    "arguments": {
      "data": {
        "table": {
          "name": "Tasks",
          "default_view_name": "All Tasks",
          "fields": [
            {
              "field_name": "Task Title",
              "type": 1,
              "ui_type": "Text"
            },
            {
              "field_name": "Description",
              "type": 1,
              "ui_type": "Text"
            },
            {
              "field_name": "Status",
              "type": 3,
              "ui_type": "SingleSelect",
              "property": {
                "options": [
                  {"name": "To Do", "color": 1},
                  {"name": "In Progress", "color": 2},
                  {"name": "Done", "color": 3}
                ]
              }
            },
            {
              "field_name": "Priority",
              "type": 3,
              "ui_type": "SingleSelect",
              "property": {
                "options": [
                  {"name": "Low", "color": 1},
                  {"name": "Medium", "color": 2},
                  {"name": "High", "color": 3}
                ]
              }
            },
            {
              "field_name": "Assignee",
              "type": 11,
              "ui_type": "User"
            },
            {
              "field_name": "Due Date",
              "type": 5,
              "ui_type": "DateTime"
            }
          ]
        }
      },
      "path": {
        "app_token": "YOUR_APP_TOKEN_HERE"
      },
      "useUAT": true
    }
  }
}
```

### Step 3: Add Records
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "bitable_v1_appTableRecord_create",
    "arguments": {
      "data": {
        "fields": {
          "Task Title": "Set up project infrastructure",
          "Description": "Initialize the development environment and tools",
          "Status": "In Progress",
          "Priority": "High",
          "Due Date": 1735689600000
        }
      },
      "params": {
        "user_id_type": "open_id"
      },
      "path": {
        "app_token": "YOUR_APP_TOKEN_HERE",
        "table_id": "YOUR_TABLE_ID_HERE"
      },
      "useUAT": true
    }
  }
}
```

## 🎯 Natural Language Commands in Cursor

### Basic Commands
```
"Create a Base app called 'Customer Management'"
"Create a table called 'Customers' with fields for name, email, phone, and company"
"Add a record to the Customers table with name 'John Doe' and email 'john@example.com'"
```

### Advanced Commands
```
"Set up a complete project management Base with:
- Tasks table (title, description, status, priority, assignee, due date)
- Team Members table (name, email, role, department)
- Projects table (name, description, start date, end date, status)
- Link the tables together with proper relationships"
```

### Data Management Commands
```
"Search for all tasks with status 'In Progress'"
"Update the priority of task 'Setup database' to 'High'"
"List all team members in the 'Engineering' department"
```

## 🔧 Configuration Options

### Base Creation Parameters
- **name**: Base application name (required)
- **folder_token**: Folder where to create the Base (optional)
- **time_zone**: Timezone for the Base (optional)

### Table Creation Parameters
- **name**: Table name (required)
- **default_view_name**: Default view name (optional)
- **fields**: Array of field definitions (optional)

### Field Types Available
- **1**: Text (multiline)
- **2**: Number
- **3**: SingleSelect
- **4**: MultiSelect
- **5**: DateTime
- **7**: Checkbox
- **11**: User (Person)
- **13**: PhoneNumber
- **15**: URL
- **17**: Attachment
- **18**: Link (one-way)
- **20**: Formula
- **21**: DuplexLink (two-way)
- **22**: Location
- **23**: GroupChat
- **1001**: CreatedTime
- **1002**: ModifiedTime
- **1003**: CreatedUser
- **1004**: ModifiedUser
- **1005**: AutoSerial

## 🚀 Example: Complete Project Management Base

### 1. Create the Base
```bash
# In Cursor AI chat:
"Create a comprehensive project management Base called 'Team Project Hub'"
```

### 2. Create Multiple Tables
```bash
# In Cursor AI chat:
"Create these tables in the Base:
1. Projects (name, description, start_date, end_date, status, owner)
2. Tasks (title, description, project, assignee, status, priority, due_date)
3. Team Members (name, email, role, department, skills)
4. Milestones (name, project, due_date, status, description)"
```

### 3. Add Sample Data
```bash
# In Cursor AI chat:
"Add sample data to all tables with realistic project management information"
```

### 4. Create Relationships
```bash
# In Cursor AI chat:
"Set up relationships between the tables so tasks link to projects and assignees"
```

## 📊 Available Base Operations

### App Management
- `bitable_v1_app_create` - Create Base applications
- `bitable_v1_appTable_list` - List all tables in a Base

### Table Management
- `bitable_v1_appTable_create` - Create tables with fields
- `bitable_v1_appTableField_list` - List fields in a table

### Record Management
- `bitable_v1_appTableRecord_create` - Create records
- `bitable_v1_appTableRecord_search` - Search records
- `bitable_v1_appTableRecord_update` - Update records

## 🛠️ Troubleshooting

### Common Issues
1. **Authentication Error**: Token expired - refresh your Lark app credentials
2. **Permission Error**: Ensure your app has Base permissions
3. **Field Type Error**: Use correct field type numbers
4. **App Token Error**: Get the correct app_token from the Base URL

### Quick Fixes
```bash
# Test the MCP server
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node dist/cli.js mcp --config config-larksuite-corrected.json --mode stdio

# Check available tools
node dist/cli.js mcp --config config-larksuite-corrected.json --mode stdio --tools "bitable"
```

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Base application is created successfully
- ✅ Tables are created with proper fields
- ✅ Records can be added and searched
- ✅ Relationships work between tables
- ✅ No error messages in the response

---

## 🚀 Ready to Create Bases!

The Lark MCP Tool is fully capable of creating and managing Base applications. You can:

- Create Base applications with natural language
- Design complex table structures
- Add and manage data
- Set up relationships between tables
- Automate database operations

**Example command in Cursor:**
```
"Create a customer relationship management Base with tables for customers, contacts, opportunities, and activities"
```

---

**Status**: ✅ **READY FOR BASE CREATION** 🚀

**Last Updated**: December 2024  
**Version**: 2.0.0 
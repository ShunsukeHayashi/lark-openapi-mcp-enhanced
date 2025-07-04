/**
 * Real implementation helpers for Genesis tools
 * These functions make actual API calls to Lark
 */

import * as lark from '@larksuiteoapi/node-sdk';

/**
 * Create a Lark Base with tables and fields
 */
export async function createLarkBase(
  client: lark.Client,
  params: {
    name: string;
    folderToken?: string;
    tables: Array<{
      name: string;
      fields: Array<{
        field_name: string;
        type: number;
        property?: any;
      }>;
    }>;
  }
): Promise<{ baseToken: string; tableIds: string[] }> {
  try {
    // Step 1: Create the base app
    const appResponse = await client.bitable.app.create({
      data: {
        name: params.name,
        folder_token: params.folderToken || '',
      },
    });

    if (!appResponse.data?.app?.app_token) {
      throw new Error('Failed to create base app');
    }

    const appToken = appResponse.data.app.app_token;
    const tableIds: string[] = [];

    // Step 2: Create tables
    for (const table of params.tables) {
      const tableResponse = await client.bitable.appTable.create({
        path: { app_token: appToken },
        data: {
          table: {
            name: table.name,
            fields: table.fields,
          },
        },
      });

      if (tableResponse.data?.table_id) {
        tableIds.push(tableResponse.data.table_id);
      }
    }

    return { baseToken: appToken, tableIds };
  } catch (error) {
    throw new Error(`Failed to create Lark Base: ${(error as Error).message}`);
  }
}

/**
 * Create a view for a table
 */
export async function createTableView(
  client: lark.Client,
  params: {
    appToken: string;
    tableId: string;
    viewName: string;
    viewType?: 'grid' | 'kanban' | 'gallery' | 'gantt' | 'form';
  }
): Promise<{ viewId: string }> {
  try {
    const response = await client.bitable.appTableView.create({
      path: {
        app_token: params.appToken,
        table_id: params.tableId,
      },
      data: {
        view_name: params.viewName,
        view_type: params.viewType,
      },
    });

    if (!response.data?.view?.view_id) {
      throw new Error('Failed to create view');
    }

    return { viewId: response.data.view.view_id };
  } catch (error) {
    throw new Error(`Failed to create view: ${(error as Error).message}`);
  }
}

/**
 * Copy a dashboard
 */
export async function copyDashboard(
  client: lark.Client,
  params: {
    appToken: string;
    dashboardId: string;
    name: string;
  }
): Promise<{ dashboardId: string }> {
  try {
    const response = await client.bitable.appDashboard.copy({
      path: {
        app_token: params.appToken,
        block_id: params.dashboardId,
      },
      data: {
        name: params.name,
      },
    });

    if (!response.data?.block_id) {
      throw new Error('Failed to copy dashboard');
    }

    return { dashboardId: response.data.block_id };
  } catch (error) {
    throw new Error(`Failed to copy dashboard: ${(error as Error).message}`);
  }
}

/**
 * List workflows (automation)
 */
export async function listWorkflows(
  client: lark.Client,
  params: {
    appToken: string;
    pageSize?: number;
  }
): Promise<{ workflows: any[] }> {
  try {
    const response = await client.bitable.appWorkflow.list({
      path: {
        app_token: params.appToken,
      },
      params: {
        page_size: params.pageSize || 20,
      },
    });

    return { workflows: response.data?.workflows || [] };
  } catch (error) {
    throw new Error(`Failed to list workflows: ${(error as Error).message}`);
  }
}

/**
 * Create filter view for spreadsheet
 */
export async function createSpreadsheetFilterView(
  client: lark.Client,
  params: {
    spreadsheetToken: string;
    sheetId: string;
    filterViewName: string;
    range: string;
    filterConditions: any[];
  }
): Promise<{ filterViewId: string }> {
  try {
    const response = await client.sheets.spreadsheetSheetFilterView.create({
      path: {
        spreadsheet_token: params.spreadsheetToken,
        sheet_id: params.sheetId,
      },
      data: {
        filter_view_name: params.filterViewName,
        range: params.range,
      },
    });

    if (!response.data?.filter_view?.filter_view_id) {
      throw new Error('Failed to create filter view');
    }

    return { filterViewId: response.data.filter_view.filter_view_id };
  } catch (error) {
    throw new Error(`Failed to create filter view: ${(error as Error).message}`);
  }
}

/**
 * Helper to convert Genesis field types to Lark field types
 */
export function mapFieldType(genesisType: string): number {
  const typeMap: Record<string, number> = {
    'text': 1,        // Text Multiline
    'number': 2,      // Number
    'select': 3,      // SingleSelect
    'multiselect': 4, // MultiSelect
    'date': 5,        // DateTime
    'checkbox': 7,    // Checkbox
    'user': 11,       // User
    'phone': 13,      // PhoneNumber
    'url': 15,        // Url
    'attachment': 17, // Attachment
    'link': 18,       // Link (one-way)
    'formula': 20,    // Formula
    'duplex': 21,     // DuplexLink (two-way)
    'location': 22,   // Location
    'created': 1001,  // CreatedTime
    'modified': 1002, // ModifiedTime
    'creator': 1003,  // CreatedUser
    'modifier': 1004, // ModifiedUser
    'autonumber': 1005, // AutoSerial
  };

  return typeMap[genesisType.toLowerCase()] || 1; // Default to text
}

/**
 * Helper to create standard fields for a table
 */
export function createStandardFields(tableName: string): any[] {
  const baseFields = [
    {
      field_name: 'ID',
      type: 1005, // AutoSerial
      property: {},
    },
    {
      field_name: 'Name',
      type: 1, // Text
      property: {},
    },
    {
      field_name: 'Created Date',
      type: 1001, // CreatedTime
      property: {},
    },
    {
      field_name: 'Modified Date',
      type: 1002, // ModifiedTime
      property: {},
    },
    {
      field_name: 'Created By',
      type: 1003, // CreatedUser
      property: {},
    },
  ];

  // Add table-specific fields
  switch (tableName.toLowerCase()) {
    case 'tasks':
      return [
        ...baseFields,
        {
          field_name: 'Status',
          type: 3, // SingleSelect
          property: {
            options: [
              { name: 'To Do' },
              { name: 'In Progress' },
              { name: 'Review' },
              { name: 'Done' },
            ],
          },
        },
        {
          field_name: 'Priority',
          type: 3, // SingleSelect
          property: {
            options: [
              { name: 'Low', color: 0 },
              { name: 'Medium', color: 1 },
              { name: 'High', color: 2 },
              { name: 'Urgent', color: 3 },
            ],
          },
        },
        {
          field_name: 'Assignee',
          type: 11, // User
          property: { multiple: false },
        },
        {
          field_name: 'Due Date',
          type: 5, // DateTime
          property: {},
        },
      ];

    case 'projects':
      return [
        ...baseFields,
        {
          field_name: 'Status',
          type: 3, // SingleSelect
          property: {
            options: [
              { name: 'Planning' },
              { name: 'Active' },
              { name: 'On Hold' },
              { name: 'Completed' },
            ],
          },
        },
        {
          field_name: 'Start Date',
          type: 5, // DateTime
          property: {},
        },
        {
          field_name: 'End Date',
          type: 5, // DateTime
          property: {},
        },
        {
          field_name: 'Project Lead',
          type: 11, // User
          property: { multiple: false },
        },
      ];

    default:
      return baseFields;
  }
}
/**
 * Tests for Complete Function Tools
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import * as lark from '@larksuiteoapi/node-sdk';
import {
  getUserInfo,
  createUser,
  createDepartment,
  createGroup,
  createApproval,
  createWikiSpace,
  bookMeetingRoom,
  createOKR,
  createEmployee,
} from '../../src/mcp-tool/tools/en/builtin-tools/complete/all-functions';

// Mock Lark client
const mockClient = {
  contact: {
    user: {
      get: jest.fn(),
      create: jest.fn(),
    },
    department: {
      create: jest.fn(),
    },
    group: {
      create: jest.fn(),
    },
  },
  approval: {
    instance: {
      create: jest.fn(),
    },
  },
  wiki: {
    space: {
      create: jest.fn(),
    },
  },
  okr: {
    okr: {
      create: jest.fn(),
    },
  },
} as unknown as lark.Client;

describe('Complete Function Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserInfo', () => {
    test('should get user information by ID', async () => {
      const mockUserData = {
        user: {
          user_id: 'user_123',
          name: 'John Doe',
          email: 'john@example.com',
          mobile: '+1234567890',
          department_ids: ['dept_123'],
        },
      };

      (mockClient.contact.user.get as jest.Mock).mockResolvedValue({
        data: mockUserData,
      });

      const params = {
        userIdType: 'user_id' as const,
        userId: 'user_123',
      };

      const result = await getUserInfo.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      expect(mockClient.contact.user.get).toHaveBeenCalledWith({
        path: { user_id: 'user_123' },
        params: {
          user_id_type: 'user_id',
          department_id_type: undefined,
        },
      });
      
      const text = result.content![0].text;
      expect(text).toContain('John Doe');
      expect(text).toContain('john@example.com');
    });

    test('should handle user not found error', async () => {
      (mockClient.contact.user.get as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      const params = {
        userIdType: 'email' as const,
        userId: 'notfound@example.com',
      };

      const result = await getUserInfo.customHandler!(mockClient, params);

      expect(result.isError).toBeTruthy();
      expect(result.content![0].text).toContain('User not found');
    });
  });

  describe('createUser', () => {
    test('should create new user', async () => {
      const mockCreatedUser = {
        user: {
          user_id: 'new_user_123',
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
      };

      (mockClient.contact.user.create as jest.Mock).mockResolvedValue({
        data: mockCreatedUser,
      });

      const params = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        mobile: '+1987654321',
        departmentIds: ['dept_456'],
        employeeNo: 'EMP001',
      };

      const result = await createUser.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      expect(mockClient.contact.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          mobile: '+1987654321',
          department_ids: ['dept_456'],
          employee_no: 'EMP001',
          employee_type: 1,
        },
      });
      
      const text = result.content![0].text;
      expect(text).toContain('new_user_123');
      expect(text).toContain('Jane Smith');
    });
  });

  describe('createDepartment', () => {
    test('should create new department', async () => {
      const mockDepartment = {
        department: {
          department_id: 'dept_789',
          name: 'Engineering',
          parent_department_id: '0',
        },
      };

      (mockClient.contact.department.create as jest.Mock).mockResolvedValue({
        data: mockDepartment,
      });

      const params = {
        name: 'Engineering',
        parentDepartmentId: '0',
        leaderUserId: 'user_123',
        order: 1,
      };

      const result = await createDepartment.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      expect(mockClient.contact.department.create).toHaveBeenCalledWith({
        data: {
          name: 'Engineering',
          parent_department_id: '0',
          leader_user_id: 'user_123',
          order: 1,
        },
      });
      
      const text = result.content![0].text;
      expect(text).toContain('dept_789');
      expect(text).toContain('Engineering');
    });
  });

  describe('createGroup', () => {
    test('should create user group', async () => {
      const mockGroup = {
        group: {
          group_id: 'group_123',
          name: 'Developers',
          type: 0,
        },
      };

      (mockClient.contact.group.create as jest.Mock).mockResolvedValue({
        data: mockGroup,
      });

      const params = {
        name: 'Developers',
        description: 'Development team group',
        memberIdList: ['user_1', 'user_2'],
        groupType: 'static' as const,
      };

      const result = await createGroup.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      expect(mockClient.contact.group.create).toHaveBeenCalledWith({
        data: {
          name: 'Developers',
          description: 'Development team group',
          type: 0,
        },
      });
      
      const text = result.content![0].text;
      expect(text).toContain('group_123');
      expect(text).toContain('Developers');
    });
  });

  describe('createApproval', () => {
    test('should create approval instance', async () => {
      const mockApproval = {
        instance_code: 'approval_123',
        status: 'PENDING',
      };

      (mockClient.approval.instance.create as jest.Mock).mockResolvedValue({
        data: mockApproval,
      });

      const params = {
        approvalCode: 'EXPENSE_APPROVAL',
        userId: 'user_123',
        form: {
          amount: 1000,
          description: 'Business trip expenses',
        },
        nodeApprovers: [
          { key: 'manager', value: ['user_456'] },
        ],
      };

      const result = await createApproval.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      expect(mockClient.approval.instance.create).toHaveBeenCalledWith({
        data: {
          approval_code: 'EXPENSE_APPROVAL',
          user_id: 'user_123',
          form: JSON.stringify(params.form),
          node_approver_user_id_list: [
            { key: 'manager', value: ['user_456'] },
          ],
          uuid: undefined,
        },
      });
      
      const text = result.content![0].text;
      expect(text).toContain('approval_123');
      expect(text).toContain('PENDING');
    });
  });

  describe('bookMeetingRoom', () => {
    test('should book meeting room', async () => {
      const params = {
        roomId: 'room_123',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        eventSubject: 'Team Standup',
        attendees: ['user_1', 'user_2'],
        needNotification: true,
      };

      const result = await bookMeetingRoom.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      const text = result.content![0].text;
      expect(text).toContain('room_123');
      expect(text).toContain('Team Standup');
      expect(text).toContain('booking_');
      expect(text).toContain('successfully');
    });
  });

  describe('createOKR', () => {
    test('should create OKR (simulated)', async () => {
      const params = {
        periodId: 'Q1_2024',
        objective: {
          content: 'Improve customer satisfaction',
          confidential: false,
          position: 1,
        },
        keyResults: [
          {
            content: 'Increase NPS score to 70',
            score: 0,
            weight: 50,
            progressRate: 0,
          },
          {
            content: 'Reduce support ticket response time to 2 hours',
            score: 0,
            weight: 50,
            progressRate: 0,
          },
        ],
      };

      const result = await createOKR.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      const text = result.content![0].text;
      expect(text).toContain('okr_');
      expect(text).toContain('Q1_2024');
      expect(text).toContain('Improve customer satisfaction');
      expect(text).toContain('2'); // number of key results
      expect(text).toContain('simulated');
    });
  });

  describe('createEmployee', () => {
    test('should create employee record', async () => {
      const params = {
        employeeNumber: 'EMP002',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@company.com',
        mobile: '+1234567890',
        departmentId: 'dept_123',
        jobTitle: 'Senior Engineer',
        jobLevel: 'L4',
        workLocation: 'San Francisco',
        hireDate: '2024-01-15',
        employmentType: 'full_time' as const,
        managerId: 'user_456',
      };

      const result = await createEmployee.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      const text = result.content![0].text;
      expect(text).toContain('emp_');
      expect(text).toContain('EMP002');
      expect(text).toContain('Alice Johnson');
      expect(text).toContain('active');
      expect(text).toContain('successfully');
    });
  });
});
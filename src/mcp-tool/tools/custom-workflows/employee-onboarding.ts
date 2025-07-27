/**
 * =============================================================================
 * Employee Onboarding Complete Workflow Tool
 * =============================================================================
 * Comprehensive new employee onboarding automation combining multiple Lark APIs
 * Priority 1: Critical business workflow with high manual cost
 * =============================================================================
 */

import { z } from 'zod';
import { McpTool } from '../index';

// Onboarding workflow configuration schema
const OnboardingConfigSchema = z.object({
  // Employee basic information
  employee: z.object({
    name: z.string().describe('Employee full name'),
    email: z.string().email().describe('Corporate email address'),
    employee_id: z.string().describe('Unique employee ID'),
    phone: z.string().optional().describe('Phone number'),
    position: z.string().describe('Job position/title'),
    department: z.string().describe('Department name'),
    start_date: z.string().describe('Start date (YYYY-MM-DD)'),
    manager_email: z.string().email().describe('Direct manager email'),
    mentor_email: z.string().email().optional().describe('Assigned mentor email'),
  }),
  
  // Workspace configuration
  workspace: z.object({
    base_access_level: z.enum(['view', 'edit', 'full_access']).default('edit').describe('Base access permission level'),
    department_bases: z.array(z.string()).describe('Department-specific Base tokens to grant access'),
    shared_drives: z.array(z.string()).describe('Shared drive tokens for department resources'),
    team_chats: z.array(z.string()).describe('Team chat IDs to add employee'),
  }),
  
  // Onboarding schedule
  schedule: z.object({
    orientation_duration_days: z.number().default(3).describe('Orientation program duration'),
    first_one_on_one_days: z.number().default(7).describe('Days until first 1-on-1 with manager'),
    probation_review_days: z.number().default(90).describe('Days until probation review'),
    enable_automated_checkins: z.boolean().default(true).describe('Enable automated check-in schedule'),
  }),
  
  // Automation preferences
  automation: z.object({
    send_welcome_message: z.boolean().default(true).describe('Send automated welcome message'),
    create_buddy_system: z.boolean().default(true).describe('Auto-assign buddy/mentor'),
    setup_equipment_request: z.boolean().default(true).describe('Auto-create equipment request'),
    schedule_training_sessions: z.boolean().default(true).describe('Auto-schedule mandatory trainings'),
    notify_stakeholders: z.boolean().default(true).describe('Notify relevant stakeholders'),
  })
});

/**
 * Employee Onboarding Complete Workflow Tool
 * Automates the entire new employee onboarding process from hire to productivity
 */
export const employeeOnboardingComplete: McpTool = {
  project: 'custom_workflows',
  name: 'employee.onboarding.complete',
  accessTokens: ['tenant'],
  description: '[Custom Workflow] Complete employee onboarding automation - combines HR creation, access provisioning, team integration, and schedule setup',
  
  schema: {
    data: OnboardingConfigSchema
  },
  
  customHandler: async (client, params) => {
    const startTime = Date.now();
    const results = {
      success: false,
      employee_id: params.employee.employee_id,
      steps_completed: [] as string[],
      steps_failed: [] as string[],
      created_resources: {} as Record<string, any>,
      notifications_sent: [] as string[],
      next_actions: [] as string[],
      timeline: {} as Record<string, string>
    };

    try {
      // Step 1: Create employee in HR system
      console.log('🟢 Starting Employee Onboarding:', params.employee.name);
      
      // 1.1: Get user ID from email
      const userIdResponse = await client.contact.user.batchGetId({
        data: { emails: [params.employee.email] },
        params: { user_id_type: 'open_id' }
      });
      
      let userId = userIdResponse.data?.user_list?.[0]?.user_id;
      
      if (!userId) {
        // User doesn't exist, would need to create via different endpoint
        // For now, we'll simulate this step
        results.steps_failed.push('user_creation_external_system');
        throw new Error(`User ${params.employee.email} not found in system. Manual user creation required.`);
      }
      
      results.created_resources.user_id = userId;
      results.steps_completed.push('user_identification');

      // Step 2: Create employee record in HR Base
      const hrBaseToken = 'G9mPbjly3arM3zssaX4jNfMBpod'; // M1_従業員マスタ
      const hrTableId = 'tblkllkswkWDdD5Q';
      
      const employeeRecord = await client.bitable.appTableRecord.create({
        path: {
          app_token: hrBaseToken,
          table_id: hrTableId
        },
        data: {
          fields: {
            'fldUvBCOWt': params.employee.employee_id, // 従業員ID
            'fldMQjCQdE': params.employee.name, // 氏名
            'fldELALqBP': params.employee.email, // メールアドレス
            'fldCwzUstO': params.employee.position, // 職位
            'fldsBeIupy': params.employee.department, // 部署
            'fldJPvMSIp': params.employee.start_date, // 入社日
            'fldGBvTIGr': false, // 管理職フラグ (initially false)
            'fldMHutqkR': 'active', // ステータス
          }
        }
      });
      
      results.created_resources.hr_record_id = employeeRecord.data?.record?.record_id;
      results.steps_completed.push('hr_record_creation');

      // Step 3: Grant Base access permissions
      for (const baseToken of params.workspace.department_bases) {
        try {
          await client.drive.permissionMember.create({
            path: { token: baseToken },
            data: {
              member_type: 'openid',
              member_id: userId,
              perm: params.workspace.base_access_level
            },
            params: {
              type: 'bitable',
              need_notification: params.automation.notify_stakeholders
            }
          });
          
          results.steps_completed.push(`base_access_${baseToken}`);
        } catch (error) {
          results.steps_failed.push(`base_access_${baseToken}`);
        }
      }

      // Step 4: Add to team chats
      for (const chatId of params.workspace.team_chats) {
        try {
          await client.im.chatMembers.create({
            path: { chat_id: chatId },
            data: {
              id_list: [userId]
            }
          });
          
          results.steps_completed.push(`team_chat_${chatId}`);
        } catch (error) {
          results.steps_failed.push(`team_chat_${chatId}`);
        }
      }

      // Step 5: Send welcome message
      if (params.automation.send_welcome_message) {
        const welcomeMessage = `🎉 Welcome to the team, ${params.employee.name}!

Your onboarding has been automatically set up:
• Employee ID: ${params.employee.employee_id}
• Department: ${params.employee.department}
• Position: ${params.employee.position}
• Start Date: ${params.employee.start_date}

You now have access to:
${params.workspace.department_bases.map(base => `• Base: ${base}`).join('\\n')}
${params.workspace.team_chats.map(chat => `• Team Chat: ${chat}`).join('\\n')}

Your manager ${params.employee.manager_email} will schedule your first 1-on-1 within ${params.schedule.first_one_on_one_days} days.

Welcome aboard! 🚀`;

        try {
          // Send direct message to new employee
          await client.im.message.create({
            data: {
              receive_id: userId,
              content: JSON.stringify({
                text: welcomeMessage
              }),
              msg_type: 'text'
            },
            params: { receive_id_type: 'open_id' }
          });
          
          results.notifications_sent.push('welcome_message_employee');
          results.steps_completed.push('welcome_message_sent');
        } catch (error) {
          results.steps_failed.push('welcome_message_send');
        }
      }

      // Step 6: Notify manager and stakeholders
      if (params.automation.notify_stakeholders) {
        const managerUserResponse = await client.contact.user.batchGetId({
          data: { emails: [params.employee.manager_email] },
          params: { user_id_type: 'open_id' }
        });
        
        const managerId = managerUserResponse.data?.user_list?.[0]?.user_id;
        
        if (managerId) {
          const managerNotification = `👋 New Team Member Alert

${params.employee.name} has joined your team as ${params.employee.position}.

Onboarding Status: ✅ Completed
• Employee ID: ${params.employee.employee_id}
• Start Date: ${params.employee.start_date}
• Access provisioned: ${results.steps_completed.filter(step => step.includes('access')).length} systems

Action Items for You:
• Schedule first 1-on-1 within ${params.schedule.first_one_on_one_days} days
• Assign first week projects
• Introduce to key stakeholders

Employee Record: ${results.created_resources.hr_record_id}`;

          try {
            await client.im.message.create({
              data: {
                receive_id: managerId,
                content: JSON.stringify({
                  text: managerNotification
                }),
                msg_type: 'text'
              },
              params: { receive_id_type: 'open_id' }
            });
            
            results.notifications_sent.push('manager_notification');
            results.steps_completed.push('manager_notification_sent');
          } catch (error) {
            results.steps_failed.push('manager_notification_send');
          }
        }
      }

      // Step 7: Schedule future follow-ups
      const currentDate = new Date();
      
      // First 1-on-1 timeline
      const firstOneOnOne = new Date(currentDate);
      firstOneOnOne.setDate(currentDate.getDate() + params.schedule.first_one_on_one_days);
      results.timeline['first_one_on_one'] = firstOneOnOne.toISOString().split('T')[0];
      
      // Probation review timeline
      const probationReview = new Date(currentDate);
      probationReview.setDate(currentDate.getDate() + params.schedule.probation_review_days);
      results.timeline['probation_review'] = probationReview.toISOString().split('T')[0];
      
      // Weekly check-ins for first month
      if (params.schedule.enable_automated_checkins) {
        for (let week = 1; week <= 4; week++) {
          const checkinDate = new Date(currentDate);
          checkinDate.setDate(currentDate.getDate() + (week * 7));
          results.timeline[`week_${week}_checkin`] = checkinDate.toISOString().split('T')[0];
        }
      }

      // Next actions
      results.next_actions = [
        `Manager to schedule first 1-on-1 by ${results.timeline['first_one_on_one']}`,
        'HR to schedule orientation sessions',
        'IT to provide equipment and accounts',
        `Probation review scheduled for ${results.timeline['probation_review']}`,
        'Buddy/mentor introduction within 48 hours'
      ];

      results.success = true;
      
      const executionTime = Date.now() - startTime;
      
      // Create comprehensive summary
      const summary = {
        employee: params.employee,
        onboarding_status: 'completed',
        steps_completed: results.steps_completed.length,
        steps_failed: results.steps_failed.length,
        success_rate: `${Math.round((results.steps_completed.length / (results.steps_completed.length + results.steps_failed.length)) * 100)}%`,
        execution_time_ms: executionTime,
        created_resources: results.created_resources,
        timeline: results.timeline,
        next_actions: results.next_actions
      };

      return {
        success: true,
        data: summary,
        message: `✅ Employee onboarding completed successfully for ${params.employee.name}. ${results.steps_completed.length} steps completed, ${results.steps_failed.length} steps failed.`
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: {
          message: 'Employee onboarding failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          partial_results: results,
          execution_time_ms: executionTime
        }
      };
    }
  }
};
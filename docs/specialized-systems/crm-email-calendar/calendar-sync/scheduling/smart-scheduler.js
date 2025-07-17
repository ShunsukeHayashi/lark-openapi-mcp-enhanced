/**
 * Smart Scheduler - AI-powered meeting scheduling assistant
 * Handles optimal meeting time suggestions and conflict resolution
 */

const { LarkAPI } = require('../../../src/utils/lark-api');
const { OpenAI } = require('openai');
const moment = require('moment-timezone');

class SmartScheduler {
  constructor(config) {
    this.config = config;
    this.larkAPI = new LarkAPI(config.lark);
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    });
    this.defaultTimezone = config.timezone || 'Asia/Tokyo';
    this.businessHours = config.businessHours || {
      start: 9,
      end: 18,
      workDays: [1, 2, 3, 4, 5] // Monday to Friday
    };
  }

  /**
   * Find optimal meeting time
   */
  async findOptimalMeetingTime({
    participants,
    duration,
    preferredTimeRange,
    meetingType,
    customerId,
    urgency = 'normal',
    constraints = {}
  }) {
    try {
      // Get availability for all participants
      const availability = await this.getParticipantsAvailability(
        participants,
        preferredTimeRange
      );
      
      // Get customer preferences if available
      const customerPreferences = customerId ? 
        await this.getCustomerPreferences(customerId) : null;
      
      // Find available slots
      const availableSlots = this.findAvailableSlots(
        availability,
        duration,
        preferredTimeRange
      );
      
      // Apply constraints
      const filteredSlots = this.applyConstraints(availableSlots, constraints);
      
      // Rank slots by optimality
      const rankedSlots = await this.rankTimeSlots(
        filteredSlots,
        {
          meetingType,
          customerPreferences,
          urgency,
          participants
        }
      );
      
      // Get top recommendations
      const recommendations = rankedSlots.slice(0, 5).map(slot => ({
        ...slot,
        reasoning: this.generateRecommendationReasoning(slot)
      }));
      
      return {
        recommendations,
        allSlots: rankedSlots,
        constraints: constraints,
        analysis: {
          totalSlotsFound: availableSlots.length,
          slotsAfterConstraints: filteredSlots.length,
          participantCount: participants.length,
          requestedDuration: duration
        }
      };
    } catch (error) {
      console.error('Error finding optimal meeting time:', error);
      throw error;
    }
  }

  /**
   * Get participants' availability
   */
  async getParticipantsAvailability(participants, timeRange) {
    const availability = new Map();
    
    for (const participant of participants) {
      try {
        // Get calendar events
        const events = await this.larkAPI.getCalendarEvents({
          userId: participant.id,
          startTime: timeRange.start,
          endTime: timeRange.end
        });
        
        // Get working hours
        const workingHours = await this.getWorkingHours(participant.id);
        
        // Calculate busy times
        const busyTimes = this.calculateBusyTimes(events);
        
        availability.set(participant.id, {
          participant,
          events,
          busyTimes,
          workingHours,
          timezone: participant.timezone || this.defaultTimezone
        });
      } catch (error) {
        console.error(`Error getting availability for ${participant.id}:`, error);
        // Continue with other participants
      }
    }
    
    return availability;
  }

  /**
   * Find available time slots
   */
  findAvailableSlots(availability, duration, timeRange) {
    const slots = [];
    const slotDuration = duration * 60 * 1000; // Convert to milliseconds
    const searchStart = new Date(timeRange.start);
    const searchEnd = new Date(timeRange.end);
    
    // Generate potential slots
    const current = new Date(searchStart);
    current.setMinutes(0, 0, 0); // Round to hour
    
    while (current < searchEnd) {
      const slotEnd = new Date(current.getTime() + slotDuration);
      
      // Check if slot is within business hours
      if (this.isWithinBusinessHours(current, slotEnd)) {
        // Check availability for all participants
        const isAvailable = this.checkSlotAvailability(
          current,
          slotEnd,
          availability
        );
        
        if (isAvailable) {
          slots.push({
            start: new Date(current),
            end: new Date(slotEnd),
            duration: duration,
            conflicts: [],
            score: 0
          });
        }
      }
      
      // Move to next slot (15-minute increments)
      current.setMinutes(current.getMinutes() + 15);
    }
    
    return slots;
  }

  /**
   * Check if time slot is available for all participants
   */
  checkSlotAvailability(start, end, availability) {
    for (const [participantId, data] of availability) {
      // Convert times to participant's timezone
      const participantStart = moment(start).tz(data.timezone);
      const participantEnd = moment(end).tz(data.timezone);
      
      // Check against busy times
      for (const busyTime of data.busyTimes) {
        if (this.timeRangesOverlap(
          { start: participantStart, end: participantEnd },
          { start: busyTime.start, end: busyTime.end }
        )) {
          return false;
        }
      }
      
      // Check against working hours
      if (!this.isWithinWorkingHours(
        participantStart,
        participantEnd,
        data.workingHours
      )) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Apply scheduling constraints
   */
  applyConstraints(slots, constraints) {
    let filteredSlots = [...slots];
    
    // Minimum advance notice
    if (constraints.minAdvanceHours) {
      const minStartTime = new Date(
        Date.now() + constraints.minAdvanceHours * 60 * 60 * 1000
      );
      filteredSlots = filteredSlots.filter(slot => slot.start >= minStartTime);
    }
    
    // Maximum days ahead
    if (constraints.maxDaysAhead) {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + constraints.maxDaysAhead);
      filteredSlots = filteredSlots.filter(slot => slot.start <= maxDate);
    }
    
    // Preferred days of week
    if (constraints.preferredDays && constraints.preferredDays.length > 0) {
      filteredSlots = filteredSlots.filter(slot => 
        constraints.preferredDays.includes(slot.start.getDay())
      );
    }
    
    // Avoid specific dates
    if (constraints.avoidDates && constraints.avoidDates.length > 0) {
      filteredSlots = filteredSlots.filter(slot => {
        const slotDate = slot.start.toISOString().split('T')[0];
        return !constraints.avoidDates.includes(slotDate);
      });
    }
    
    // Buffer time before/after
    if (constraints.bufferMinutes) {
      filteredSlots = filteredSlots.filter(slot => 
        this.hasBufferTime(slot, constraints.bufferMinutes)
      );
    }
    
    return filteredSlots;
  }

  /**
   * Rank time slots by optimality
   */
  async rankTimeSlots(slots, context) {
    const scoredSlots = [];
    
    for (const slot of slots) {
      let score = 100; // Base score
      
      // Time of day preference
      score += this.scoreTimeOfDay(slot.start, context);
      
      // Day of week preference
      score += this.scoreDayOfWeek(slot.start, context);
      
      // Customer preference alignment
      if (context.customerPreferences) {
        score += this.scoreCustomerPreference(slot, context.customerPreferences);
      }
      
      // Meeting type optimization
      score += this.scoreMeetingType(slot, context.meetingType);
      
      // Urgency factor
      if (context.urgency === 'high') {
        // Prefer earlier slots for urgent meetings
        const daysFromNow = Math.floor(
          (slot.start - new Date()) / (24 * 60 * 60 * 1000)
        );
        score -= daysFromNow * 5;
      }
      
      // Travel time consideration
      score += await this.scoreTravelTime(slot, context);
      
      // Energy level optimization
      score += this.scoreEnergyLevel(slot);
      
      scoredSlots.push({
        ...slot,
        score,
        scoreBreakdown: {
          timeOfDay: this.scoreTimeOfDay(slot.start, context),
          dayOfWeek: this.scoreDayOfWeek(slot.start, context),
          customerPreference: context.customerPreferences ? 
            this.scoreCustomerPreference(slot, context.customerPreferences) : 0,
          meetingType: this.scoreMeetingType(slot, context.meetingType),
          urgency: context.urgency === 'high' ? -Math.floor((slot.start - new Date()) / (24 * 60 * 60 * 1000)) * 5 : 0,
          travelTime: await this.scoreTravelTime(slot, context),
          energyLevel: this.scoreEnergyLevel(slot)
        }
      });
    }
    
    // Sort by score (highest first)
    return scoredSlots.sort((a, b) => b.score - a.score);
  }

  /**
   * Score based on time of day
   */
  scoreTimeOfDay(time, context) {
    const hour = time.getHours();
    const minute = time.getMinutes();
    const timeValue = hour + minute / 60;
    
    // Preferred times based on meeting type
    const preferences = {
      'Demo': { optimal: [10, 14], good: [9, 11, 13, 15] },
      'Sales': { optimal: [10, 11, 14, 15], good: [9, 13, 16] },
      'Training': { optimal: [9, 10, 13, 14], good: [11, 15] },
      'Review': { optimal: [14, 15, 16], good: [10, 11, 13] }
    };
    
    const pref = preferences[context.meetingType] || 
                 { optimal: [10, 11, 14, 15], good: [9, 13, 16] };
    
    if (pref.optimal.includes(hour)) return 20;
    if (pref.good.includes(hour)) return 10;
    
    // Penalize very early or very late times
    if (hour < 9) return -20;
    if (hour >= 17) return -10;
    
    return 0;
  }

  /**
   * Score based on day of week
   */
  scoreDayOfWeek(time, context) {
    const day = time.getDay();
    
    // General preferences
    const scores = {
      1: 10,  // Monday
      2: 15,  // Tuesday (often most productive)
      3: 15,  // Wednesday
      4: 10,  // Thursday
      5: -5,  // Friday (often less ideal)
      0: -50, // Sunday (avoid)
      6: -50  // Saturday (avoid)
    };
    
    return scores[day] || 0;
  }

  /**
   * Score based on customer preferences
   */
  scoreCustomerPreference(slot, preferences) {
    let score = 0;
    
    // Preferred time windows
    if (preferences.preferredTimes) {
      const hour = slot.start.getHours();
      if (preferences.preferredTimes.includes(hour)) {
        score += 15;
      }
    }
    
    // Historical meeting times
    if (preferences.historicalTimes) {
      const hour = slot.start.getHours();
      const avgHistoricalHour = preferences.historicalTimes.reduce((a, b) => a + b, 0) / 
                                preferences.historicalTimes.length;
      const diff = Math.abs(hour - avgHistoricalHour);
      score += Math.max(0, 10 - diff * 2);
    }
    
    return score;
  }

  /**
   * Score based on meeting type
   */
  scoreMeetingType(slot, meetingType) {
    const hour = slot.start.getHours();
    const day = slot.start.getDay();
    
    switch (meetingType) {
      case 'Demo':
        // Demos work best mid-morning or mid-afternoon
        if ((hour >= 10 && hour <= 11) || (hour >= 14 && hour <= 15)) {
          return 15;
        }
        break;
      case 'Training':
        // Training sessions better in morning when people are fresh
        if (hour >= 9 && hour <= 11) {
          return 15;
        }
        break;
      case 'Sales':
        // Sales calls throughout business hours
        if (hour >= 9 && hour <= 16) {
          return 10;
        }
        break;
    }
    
    return 0;
  }

  /**
   * Score based on travel time requirements
   */
  async scoreTravelTime(slot, context) {
    // Check previous and next meetings for travel time
    let score = 0;
    
    for (const [participantId, availability] of context.participants) {
      // Find meetings before and after this slot
      const before = this.findMeetingBefore(slot.start, availability.events);
      const after = this.findMeetingAfter(slot.end, availability.events);
      
      // Check if enough travel time
      if (before && before.location && slot.location) {
        const travelTime = await this.estimateTravelTime(before.location, slot.location);
        const buffer = (slot.start - before.end) / (60 * 1000); // minutes
        
        if (buffer < travelTime) {
          score -= 20; // Not enough travel time
        } else if (buffer < travelTime * 1.5) {
          score -= 10; // Tight on travel time
        }
      }
      
      if (after && after.location && slot.location) {
        const travelTime = await this.estimateTravelTime(slot.location, after.location);
        const buffer = (after.start - slot.end) / (60 * 1000); // minutes
        
        if (buffer < travelTime) {
          score -= 20;
        } else if (buffer < travelTime * 1.5) {
          score -= 10;
        }
      }
    }
    
    return score;
  }

  /**
   * Score based on energy levels
   */
  scoreEnergyLevel(slot) {
    const hour = slot.start.getHours();
    const minute = slot.start.getMinutes();
    const time = hour + minute / 60;
    
    // Energy curve throughout the day
    if (time >= 10 && time <= 12) return 10; // Morning peak
    if (time >= 14 && time <= 16) return 10; // Afternoon peak
    if (time >= 13 && time <= 14) return -5;  // Post-lunch dip
    if (time < 9) return -10;                // Too early
    if (time > 17) return -10;               // Too late
    
    return 0;
  }

  /**
   * Generate recommendation reasoning
   */
  generateRecommendationReasoning(slot) {
    const reasons = [];
    
    // Time of day
    const hour = slot.start.getHours();
    if (hour >= 10 && hour <= 11) {
      reasons.push('朝の生産的な時間帯');
    } else if (hour >= 14 && hour <= 15) {
      reasons.push('午後の集中しやすい時間帯');
    }
    
    // Day of week
    const day = slot.start.getDay();
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    if (day >= 2 && day <= 4) {
      reasons.push(`${dayNames[day]}曜日は商談に適した曜日`);
    }
    
    // Score-based reasons
    if (slot.score > 120) {
      reasons.push('全参加者にとって最適な時間');
    } else if (slot.score > 100) {
      reasons.push('参加者の都合が良い時間');
    }
    
    // Buffer time
    if (slot.scoreBreakdown && slot.scoreBreakdown.travelTime >= 0) {
      reasons.push('前後の予定との間に十分な余裕あり');
    }
    
    return reasons.join('、');
  }

  /**
   * Get customer scheduling preferences
   */
  async getCustomerPreferences(customerId) {
    try {
      // Get historical meeting data
      const activities = await this.larkAPI.searchRecords('activities', {
        filter: {
          customer_id: customerId,
          type: { in: ['Meeting', 'Demo', 'Call'] },
          status: 'Completed'
        },
        limit: 20
      });
      
      // Analyze patterns
      const preferredTimes = this.analyzePreferredTimes(activities);
      const avgDuration = this.calculateAverageDuration(activities);
      const preferredDays = this.analyzePreferredDays(activities);
      
      return {
        preferredTimes,
        avgDuration,
        preferredDays,
        historicalCount: activities.length
      };
    } catch (error) {
      console.error('Error getting customer preferences:', error);
      return null;
    }
  }

  /**
   * Check for double booking
   */
  async checkForConflicts(proposedMeeting) {
    const conflicts = [];
    
    for (const participant of proposedMeeting.participants) {
      const events = await this.larkAPI.getCalendarEvents({
        userId: participant.id,
        startTime: proposedMeeting.start,
        endTime: proposedMeeting.end
      });
      
      if (events.length > 0) {
        conflicts.push({
          participant,
          conflictingEvents: events
        });
      }
    }
    
    return conflicts;
  }

  /**
   * Suggest resolution for conflicts
   */
  async suggestConflictResolution(conflicts, originalMeeting) {
    const resolutions = [];
    
    for (const conflict of conflicts) {
      // Analyze conflict importance
      const conflictImportance = await this.analyzeEventImportance(
        conflict.conflictingEvents[0]
      );
      
      if (conflictImportance < originalMeeting.importance) {
        resolutions.push({
          type: 'reschedule_existing',
          participant: conflict.participant,
          event: conflict.conflictingEvents[0],
          reason: '新しいミーティングの重要度が高い'
        });
      } else {
        // Find alternative times
        const alternatives = await this.findOptimalMeetingTime({
          participants: originalMeeting.participants,
          duration: originalMeeting.duration,
          preferredTimeRange: {
            start: originalMeeting.start,
            end: new Date(originalMeeting.start.getTime() + 7 * 24 * 60 * 60 * 1000)
          },
          meetingType: originalMeeting.type,
          urgency: 'normal'
        });
        
        resolutions.push({
          type: 'use_alternative',
          alternatives: alternatives.recommendations.slice(0, 3),
          reason: '既存の予定を優先'
        });
      }
    }
    
    return resolutions;
  }

  /**
   * Helper methods
   */
  isWithinBusinessHours(start, end) {
    const startHour = start.getHours();
    const endHour = end.getHours();
    const day = start.getDay();
    
    return (
      this.businessHours.workDays.includes(day) &&
      startHour >= this.businessHours.start &&
      endHour <= this.businessHours.end &&
      start.getDay() === end.getDay() // Same day
    );
  }

  isWithinWorkingHours(start, end, workingHours) {
    if (!workingHours) return this.isWithinBusinessHours(start, end);
    
    const day = start.toDate().getDay();
    const dayHours = workingHours[day];
    
    if (!dayHours || !dayHours.isWorkDay) return false;
    
    const startTime = start.hours() + start.minutes() / 60;
    const endTime = end.hours() + end.minutes() / 60;
    
    return startTime >= dayHours.start && endTime <= dayHours.end;
  }

  timeRangesOverlap(range1, range2) {
    return range1.start < range2.end && range2.start < range1.end;
  }

  calculateBusyTimes(events) {
    return events.map(event => ({
      start: moment(event.start.dateTime || event.start.date),
      end: moment(event.end.dateTime || event.end.date),
      event: event
    }));
  }

  async getWorkingHours(userId) {
    // Get user's working hours from profile or use defaults
    try {
      const user = await this.larkAPI.getUser(userId);
      return user.workingHours || this.businessHours;
    } catch (error) {
      return this.businessHours;
    }
  }

  hasBufferTime(slot, bufferMinutes) {
    // Check if slot has required buffer time before and after
    // This would need to check against actual calendar events
    return true; // Simplified for now
  }

  findMeetingBefore(time, events) {
    const before = events
      .filter(e => new Date(e.end.dateTime || e.end.date) <= time)
      .sort((a, b) => 
        new Date(b.end.dateTime || b.end.date) - 
        new Date(a.end.dateTime || a.end.date)
      );
    
    return before[0] || null;
  }

  findMeetingAfter(time, events) {
    const after = events
      .filter(e => new Date(e.start.dateTime || e.start.date) >= time)
      .sort((a, b) => 
        new Date(a.start.dateTime || a.start.date) - 
        new Date(b.start.dateTime || b.start.date)
      );
    
    return after[0] || null;
  }

  async estimateTravelTime(from, to) {
    // Simplified travel time estimation
    // In real implementation, would use mapping API
    if (!from || !to) return 0;
    if (from === to) return 0;
    
    // Default 30 minutes travel time between different locations
    return 30;
  }

  analyzePreferredTimes(activities) {
    const times = activities.map(a => 
      new Date(a.activity_date).getHours()
    );
    
    // Find most common hours
    const hourCounts = {};
    times.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  calculateAverageDuration(activities) {
    const durations = activities
      .filter(a => a.duration)
      .map(a => a.duration);
    
    if (durations.length === 0) return 60; // Default 60 minutes
    
    return Math.round(
      durations.reduce((a, b) => a + b, 0) / durations.length
    );
  }

  analyzePreferredDays(activities) {
    const days = activities.map(a => 
      new Date(a.activity_date).getDay()
    );
    
    const dayCounts = {};
    days.forEach(day => {
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    return Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => parseInt(day));
  }

  async analyzeEventImportance(event) {
    // Analyze event importance based on various factors
    let importance = 50; // Base importance
    
    // Check attendee count
    if (event.attendees && event.attendees.length > 5) {
      importance += 20;
    }
    
    // Check for VIP attendees
    const vipDomains = ['executive', 'ceo', 'cto', 'director'];
    if (event.attendees) {
      for (const attendee of event.attendees) {
        if (vipDomains.some(vip => attendee.email.includes(vip))) {
          importance += 30;
          break;
        }
      }
    }
    
    // Check keywords in title
    const importantKeywords = ['critical', '重要', 'urgent', '緊急', 'contract', '契約'];
    const title = (event.summary || '').toLowerCase();
    if (importantKeywords.some(keyword => title.includes(keyword))) {
      importance += 25;
    }
    
    return importance;
  }
}

module.exports = { SmartScheduler };
export const SYSTEM_TEMPLATES = [
  // ── 1. Transactional ──
  {
    id: 'sys-trans-1',
    category: 'Transactional',
    title: 'OTP / Verification',
    content: '[Business]: Your verification code is [OTP]. It expires in [X] minutes. Do not share this code with anyone.'
  },
  {
    id: 'sys-trans-2',
    category: 'Transactional',
    title: 'Order Confirmation',
    content: 'Hi [Name], your order #[OrderID] has been confirmed. Total: [Amount]. Expected delivery: [Date]. Track: [link]'
  },
  {
    id: 'sys-trans-3',
    category: 'Transactional',
    title: 'Payment Confirmation',
    content: 'Payment received: [Amount] for [Item/Service] on [Date]. Ref: [TxnID]. Thank you for using [Business].'
  },
  {
    id: 'sys-trans-4',
    category: 'Transactional',
    title: 'Payment Failed',
    content: 'Hi [Name], your payment of [Amount] for [Item] was not successful. Please retry or contact support: [contact]'
  },
  {
    id: 'sys-trans-5',
    category: 'Transactional',
    title: 'Delivery / Shipping Update',
    content: 'Your order #[OrderID] is out for delivery and should arrive by [Time/Date]. Rider: [Name], [Phone].'
  },
  {
    id: 'sys-trans-6',
    category: 'Transactional',
    title: 'Low Wallet Balance',
    content: 'Hi [Name], your [Business] wallet balance is [Amount]. Fund your wallet to continue enjoying uninterrupted service.'
  },
  {
    id: 'sys-trans-7',
    category: 'Transactional',
    title: 'Appointment Reminder',
    content: 'Reminder: You have an appointment with [Business/Person] on [Date] at [Time]. Reply CANCEL to reschedule.'
  },
  {
    id: 'sys-trans-8',
    category: 'Transactional',
    title: 'Password Reset',
    content: 'A password reset was requested for your [Business] account. Use code [OTP] to proceed. If this wasn\'t you, ignore this message.'
  },
  {
    id: 'sys-trans-9',
    category: 'Transactional',
    title: 'Subscription Renewal',
    content: 'Hi [Name], your [Service] subscription renews on [Date] for [Amount]. No action needed if details are unchanged.'
  },

  // ── 2. Promotional ──
  {
    id: 'sys-promo-1',
    category: 'Promotional',
    title: 'Discount / Sale',
    content: 'Hi [Name], enjoy [X]% off [Product/Service] until [Date]. Visit [link] or reply INFO to learn more.'
  },
  {
    id: 'sys-promo-2',
    category: 'Promotional',
    title: 'New Product Launch',
    content: '[Business] just launched [Product]. Available now at [link]. Reply STOP to opt out of promo messages.'
  },
  {
    id: 'sys-promo-3',
    category: 'Promotional',
    title: 'Event Invitation',
    content: 'You\'re invited: [Event Name] on [Date] at [Venue/Time]. RSVP here: [link]'
  },
  {
    id: 'sys-promo-4',
    category: 'Promotional',
    title: 'Loyalty / Rewards',
    content: 'Hi [Name], you\'ve earned [X] reward points with [Business]. Redeem them on your next purchase at [link].'
  },
  {
    id: 'sys-promo-5',
    category: 'Promotional',
    title: 'Re-engagement',
    content: 'We\'ve missed you at [Business], [Name]. Check out what\'s new: [link]. Reply STOP to opt out.'
  },
  {
    id: 'sys-promo-6',
    category: 'Promotional',
    title: 'Seasonal Greeting + Offer',
    content: 'Happy [Holiday], [Name]! [Business] has something special for you this season: [link]'
  },

  // ── 3. Religious / Faith-Based ──
  {
    id: 'sys-faith-1',
    category: 'Religious',
    title: 'Service Reminder',
    content: 'Reminder: [Church/Ministry] service holds [Day] at [Time], [Venue]. You are welcome to join us.'
  },
  {
    id: 'sys-faith-2',
    category: 'Religious',
    title: 'Devotional / Daily Word',
    content: '[Ministry] Daily Word: "[Short reflection or theme]" — [Date]. Reply STOP to unsubscribe.'
  },
  {
    id: 'sys-faith-3',
    category: 'Religious',
    title: 'Prayer Request Confirmation',
    content: 'Hi [Name], your prayer request has been received. Our prayer team will be standing with you this week.'
  },
  {
    id: 'sys-faith-4',
    category: 'Religious',
    title: 'Event / Program Invite',
    content: 'You\'re invited to [Program Name] on [Date] at [Venue]. Come expectant. For details, reply INFO.'
  },
  {
    id: 'sys-faith-5',
    category: 'Religious',
    title: 'Giving / Offering Reminder',
    content: 'Hi [Name], thank you for your continued support of [Ministry]. Give conveniently via [link/USSD code].'
  },
  {
    id: 'sys-faith-6',
    category: 'Religious',
    title: 'Intentional Moms Weekly Note',
    content: 'Intentional Moms: This week\'s focus is [theme]. Join the conversation at [link] or reply JOIN for updates.'
  },

  // ── 4. Educational ──
  {
    id: 'sys-edu-1',
    category: 'Educational',
    title: 'Course Enrollment Confirmation',
    content: 'Hi [Name], you\'re enrolled in [Course Name]. Classes begin [Date] at [Time]. Access your dashboard: [link]'
  },
  {
    id: 'sys-edu-2',
    category: 'Educational',
    title: 'Assignment / Exam Reminder',
    content: 'Reminder: [Assignment/Exam Name] is due on [Date] by [Time]. Submit via [platform/link].'
  },
  {
    id: 'sys-edu-3',
    category: 'Educational',
    title: 'Result Notification',
    content: 'Hi [Name], your result for [Course/Exam] is now available. View it here: [link]'
  },
  {
    id: 'sys-edu-4',
    category: 'Educational',
    title: 'Webinar / Workshop Invite',
    content: 'Join our session on [Topic] with [Facilitator] on [Date] at [Time]. Register: [link]'
  },
  {
    id: 'sys-edu-5',
    category: 'Educational',
    title: 'School Fee Reminder',
    content: 'Reminder: School fees for [Term/Session] are due by [Date]. Pay via [link/account details].'
  },
  {
    id: 'sys-edu-6',
    category: 'Educational',
    title: 'Mentorship Program Update',
    content: 'Hi [Name], your next [Axia Africa] mentorship session is on [Date] at [Time]. Come prepared with your questions.'
  },

  // ── 5. Healthcare & General ──
  {
    id: 'sys-gen-1',
    category: 'Healthcare & General',
    title: 'Appointment / Health Reminder',
    content: 'Reminder: You have a [Doctor/Clinic] appointment on [Date] at [Time]. Please arrive 10 minutes early.'
  },
  {
    id: 'sys-gen-2',
    category: 'Healthcare & General',
    title: 'Prescription / Refill Reminder',
    content: 'Hi [Name], your prescription for [Medication] is due for refill. Visit [Pharmacy/link] to reorder.'
  },
  {
    id: 'sys-gen-3',
    category: 'Healthcare & General',
    title: 'Birthday / Anniversary',
    content: 'Happy Birthday, [Name]! Wishing you a wonderful year ahead from all of us at [Business].'
  },
  {
    id: 'sys-gen-4',
    category: 'Healthcare & General',
    title: 'Survey / Feedback Request',
    content: 'Hi [Name], how was your recent experience with [Business]? Share feedback here: [link]. It takes under 2 minutes.'
  },
  {
    id: 'sys-gen-5',
    category: 'Healthcare & General',
    title: 'Service Outage / Alert',
    content: 'Notice: [Service] will be unavailable on [Date] from [Time] to [Time] for scheduled maintenance. We apologize for the inconvenience.'
  },
  {
    id: 'sys-gen-6',
    category: 'Healthcare & General',
    title: 'General Welcome Message',
    content: 'Welcome to [Business], [Name]! We\'re glad to have you. Explore what we offer here: [link]'
  }
];

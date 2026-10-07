class UserIdentityFormatter {
  /// Formats PM identity string such as:
  /// - "Fintech PM · Senior Product Manager"
  /// - "Payments PM · Head of Product"
  /// - "AI Product Manager · Product Lead"
  /// Optionally appends " @ Company" if [includeCompany] is true and company is provided.
  static String formatPmIdentity({
    String? specialisation,
    String? seniority,
    String? company,
    String? role,
    bool includeCompany = false,
  }) {
    final spec = (specialisation ?? '').trim();
    final sen = (seniority ?? '').trim();
    final comp = (company ?? '').trim();

    String identity = '';

    if (spec.isNotEmpty && sen.isNotEmpty) {
      // Shorten redundant "Product Manager" in specialisation if seniority also has PM / Product
      String displaySpec = spec;
      if (spec.toLowerCase().endsWith('product manager') &&
          (sen.toLowerCase().contains('product') || sen.toLowerCase().contains('pm') || sen.toLowerCase().contains('head'))) {
        displaySpec = spec.replaceAll(RegExp(r'Product Manager$', caseSensitive: false), 'PM').trim();
      }
      identity = '$displaySpec · $sen';
    } else if (spec.isNotEmpty) {
      identity = spec;
    } else if (sen.isNotEmpty) {
      identity = sen;
    } else if (role != null && role.isNotEmpty) {
      // Capitalize role
      identity = role[0].toUpperCase() + role.substring(1);
    }

    if (includeCompany && comp.isNotEmpty) {
      if (identity.isNotEmpty) {
        identity = '$identity @ $comp';
      } else {
        identity = comp;
      }
    }

    return identity;
  }

  /// Categorizes seniority into 4 simulation tiers:
  /// - 'foundational': APM / Junior PM
  /// - 'practical': Product Manager
  /// - 'strategic': Senior PM / Lead PM / Principal PM
  /// - 'executive': Head of Product / Director / VP / CPO / Founder
  static String getSeniorityTier(String? seniority) {
    if (seniority == null || seniority.isEmpty) return 'practical';
    final lower = seniority.toLowerCase();

    if (lower.contains('associate') || lower.contains('junior') || lower.contains('apm')) {
      return 'foundational';
    }
    if (lower.contains('head') ||
        lower.contains('director') ||
        lower.contains('vp') ||
        lower.contains('chief') ||
        lower.contains('cpo') ||
        lower.contains('founder')) {
      return 'executive';
    }
    if (lower.contains('senior') || lower.contains('lead') || lower.contains('principal')) {
      return 'strategic';
    }
    return 'practical';
  }

  /// Returns tailored simulation scenario details based on tier
  static Map<String, dynamic> getSimulationScenario(String tier) {
    switch (tier) {
      case 'foundational':
        return {
          'tierLabel': 'Foundational Track',
          'roleTitle': 'Associate Product Manager',
          'missionTitle': 'Sprint Trade-off: Launch Deadline vs High-Severity Edge Case',
          'context': 'Your sprint closes in 24 hours. QA flags a race condition affecting ~3% of checkout users on legacy Safari. Sales expects the new promotion banner live tomorrow morning.',
          'stakeholder': 'Eng Lead: "Fixing this clean takes 2 full days. We could hotfix a fallback, but it degrades cart animation."',
          'optionA': {
            'title': 'Deploy Hotfix & Ship on Time',
            'desc': 'Ship with fallback grace mode. Protects the launch date while preventing checkout crashes.',
            'trustDelta': 10,
            'churnDelta': -8,
            'velocityDelta': 15,
            'arrDelta': 12,
            'outcome': 'Smart triage! Sales hit promotional targets and checkout volume held steady without crashes.'
          },
          'optionB': {
            'title': 'Delay Launch 48 Hours',
            'desc': 'Hold the release to rebuild the state machine cleanly without technical debt.',
            'trustDelta': 18,
            'churnDelta': -14,
            'velocityDelta': -10,
            'arrDelta': 2,
            'outcome': 'Principled quality call! Engineering avoided debt, though Marketing had to reschedule press outreach.'
          },
        };

      case 'strategic':
        return {
          'tierLabel': 'Strategic Track',
          'roleTitle': 'Senior Product Manager',
          'missionTitle': 'Roadmap Crossroad: Core Architecture vs Generative AI Feature',
          'context': 'Executive stakeholders are pushing for an AI Copilot launch before the annual summit. Meanwhile, your data pipeline latency has grown 40%, impacting enterprise reporting SLAs.',
          'stakeholder': 'VP Sales: "Enterprise prospects are asking for AI weekly. We risk losing deals if we show zero AI roadmap."',
          'optionA': {
            'title': 'Dual-Track MVP: Scope-Capped AI + SLA Patch',
            'desc': 'Carve out 30% bandwidth for a tightly bounded AI beta while dedicating 70% to database indexing and SLA hardening.',
            'trustDelta': 20,
            'churnDelta': -15,
            'velocityDelta': 12,
            'arrDelta': 22,
            'outcome': 'Exemplary Senior PM balance! Protected core enterprise trust while satisfying executive market positioning.'
          },
          'optionB': {
            'title': 'Firm Architecture Freeze First',
            'desc': 'Defer the AI Copilot to next quarter. Publish SLA health dashboard to enterprise clients immediately.',
            'trustDelta': 25,
            'churnDelta': -18,
            'velocityDelta': -5,
            'arrDelta': 8,
            'outcome': 'High-integrity technical stewardship! Enterprise renewals stayed at 99%, though Sales missed the summit spotlight.'
          },
        };

      case 'executive':
        return {
          'tierLabel': 'Leadership & Executive Track',
          'roleTitle': 'Product Leader / Head of Product',
          'missionTitle': 'Portfolio Realignment: Restructuring Squads for Market Expansion',
          'context': 'Core product revenue has plateaued at +12% YoY, while your stealth experimental product squad generated 40% organic waitlist growth. 3 senior engineers resist transferring squads.',
          'stakeholder': 'CEO: "We need to dominate the new category this fiscal year without cratering cash cow retention."',
          'optionA': {
            'title': 'Reallocate 40% Headcount to High-Growth Squad',
            'desc': 'Shift key senior talent to the new product line; transition core product to automated maintenance and self-serve tier.',
            'trustDelta': 18,
            'churnDelta': -5,
            'velocityDelta': 24,
            'arrDelta': 35,
            'outcome': 'Bold strategic inflection! The growth bet accelerated time-to-market by 4 months, unlocking Series B metrics.'
          },
          'optionB': {
            'title': 'Spin off Dedicated Autonomous Pod with External Hires',
            'desc': 'Keep existing squad structure intact to protect baseline ARR; fund a focused 4-person growth pod.',
            'trustDelta': 15,
            'churnDelta': -12,
            'velocityDelta': 10,
            'arrDelta': 18,
            'outcome': 'Measured executive governance! Stabilized engineering morale and baseline margin with zero disruption.'
          },
        };

      case 'practical':
      default:
        return {
          'tierLabel': 'Practical Track',
          'roleTitle': 'Product Manager',
          'missionTitle': 'Funnel Crisis: 24% Activation Drop in New User Onboarding',
          'context': 'Telemetry indicates 1 in 4 signups abandon the app on Step 2 of workspace setup. Growth marketing claims the onboarding is too long; Security insists two-factor setup is non-negotiable.',
          'stakeholder': 'Head of Growth: "Every extra form field costs us 8% conversion. We are burning acquisition budget."',
          'optionA': {
            'title': 'Progressive Profiling & Deferred 2FA',
            'desc': 'Allow users straight into the product with instant magic link, enforcing 2FA only when publishing their first room.',
            'trustDelta': 16,
            'churnDelta': -20,
            'velocityDelta': 18,
            'arrDelta': 20,
            'outcome': 'Immediate activation rebound! Day-1 activation surged +31% with zero security compromises.'
          },
          'optionB': {
            'title': 'Guided Interactive Setup with Instant Value',
            'desc': 'Keep full onboarding security but pre-populate workspace with templates and a 60-second video demo.',
            'trustDelta': 22,
            'churnDelta': -12,
            'velocityDelta': 8,
            'arrDelta': 14,
            'outcome': 'High retention payoff! Activation was slightly slower, but 30-day retention jumped 18%.'
          },
        };
    }
  }
}

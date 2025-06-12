
export interface RssFeed {
  name: string;
  url: string;
}

function generateFeedName(url: string): string {
  try {
    const path = new URL(url).pathname;
    if (path.startsWith('/jobs/')) {
      let namePart = path.substring('/jobs/'.length);
      if (namePart.endsWith('/')) {
        namePart = namePart.slice(0, -1);
      }
      // Handle specific patterns like 'london/?format=rss'
      if (namePart.includes('/?format=rss')) {
        namePart = namePart.split('/?format=rss')[0];
      } else if (namePart.endsWith('/?format=rss')) {
         namePart = namePart.slice(0, -'/?format=rss'.length);
      }
      return namePart
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } else if (path.startsWith('/feeds/subject-areas/')) {
      let namePart = path.substring('/feeds/subject-areas/'.length);
       if (namePart.endsWith('/')) {
        namePart = namePart.slice(0, -1);
      }
      return namePart
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    // Fallback for unknown patterns
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments.pop() || 'Unknown Feed';
    return lastSegment
        .replace(/[?&].*$/, '') // Remove query params
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

  } catch (e) {
    console.error("Error generating feed name for URL:", url, e);
    return "Unknown Feed";
  }
}

const rawRssLinks: string[] = [
  "https://www.jobs.ac.uk/jobs/london/?format=rss",
  "https://www.jobs.ac.uk/jobs/midlands-of-england/?format=rss",
  "https://www.jobs.ac.uk/jobs/northern-england/?format=rss",
  "https://www.jobs.ac.uk/jobs/northern-ireland/?format=rss",
  "https://www.jobs.ac.uk/jobs/republic-of-ireland/?format=rss",
  "https://www.jobs.ac.uk/jobs/scotland/?format=rss",
  "https://www.jobs.ac.uk/jobs/south-east-england/?format=rss",
  "https://www.jobs.ac.uk/jobs/south-west-england/?format=rss",
  "https://www.jobs.ac.uk/jobs/wales/?format=rss",
  "https://www.jobs.ac.uk/jobs/north-south-and-central-america/?format=rss",
  "https://www.jobs.ac.uk/jobs/europe/?format=rss",
  "https://www.jobs.ac.uk/jobs/asia-and-middle-east/?format=rss",
  "https://www.jobs.ac.uk/jobs/australasia/?format=rss",
  "https://www.jobs.ac.uk/jobs/africa/?format=rss",
  "https://www.jobs.ac.uk/jobs/agriculture-food-and-veterinary/?format=rss",
  "https://www.jobs.ac.uk/jobs/architecture-building-and-planning/?format=rss",
  "https://www.jobs.ac.uk/jobs/biological-sciences/?format=rss",
  "https://www.jobs.ac.uk/jobs/business-and-management-studies/?format=rss",
  "https://www.jobs.ac.uk/jobs/computer-sciences/?format=rss",
  "https://www.jobs.ac.uk/jobs/creative-arts-and-design/?format=rss",
  "https://www.jobs.ac.uk/jobs/economics/?format=rss",
  "https://www.jobs.ac.uk/jobs/education-studies-inc-tefl/?format=rss",
  "https://www.jobs.ac.uk/jobs/engineering-and-technology/?format=rss",
  "https://www.jobs.ac.uk/jobs/health-and-medical/?format=rss",
  "https://www.jobs.ac.uk/jobs/historical-and-philosophical-studies/?format=rss",
  "https://www.jobs.ac.uk/jobs/information-management-and-librarianship/?format=rss",
  "https://www.jobs.ac.uk/jobs/languages-literature-and-culture/?format=rss",
  "https://www.jobs.ac.uk/jobs/law/?format=rss",
  "https://www.jobs.ac.uk/jobs/mathematics-and-statistics/?format=rss",
  "https://www.jobs.ac.uk/jobs/media-and-communications/?format=rss",
  "https://www.jobs.ac.uk/jobs/physical-and-environmental-sciences/?format=rss",
  "https://www.jobs.ac.uk/jobs/politics-and-government/?format=rss",
  "https://www.jobs.ac.uk/jobs/psychology/?format=rss",
  "https://www.jobs.ac.uk/jobs/social-sciences-and-social-care/?format=rss",
  "https://www.jobs.ac.uk/jobs/sport-and-leisure/?format=rss",
  "https://www.jobs.ac.uk/jobs/administrative/?format=rss",
  "https://www.jobs.ac.uk/jobs/estates-and-facilities-management/?format=rss",
  "https://www.jobs.ac.uk/jobs/finance-and-procurement/?format=rss",
  "https://www.jobs.ac.uk/jobs/fundraising-alumni-bids-and-grants/?format=rss",
  "https://www.jobs.ac.uk/jobs/health-wellbeing-and-care/?format=rss",
  "https://www.jobs.ac.uk/jobs/hospitality-retail-conferences-and-events/?format=rss",
  "https://www.jobs.ac.uk/jobs/human-resources/?format=rss",
  "https://www.jobs.ac.uk/jobs/international-activities/?format=rss",
  "https://www.jobs.ac.uk/jobs/it-services/?format=rss",
  "https://www.jobs.ac.uk/jobs/laboratory-clinical-and-technician/?format=rss",
  "https://www.jobs.ac.uk/jobs/legal-compliance-and-policy/?format=rss",
  "https://www.jobs.ac.uk/jobs/library-services-data-and-information-management/?format=rss",
  "https://www.jobs.ac.uk/jobs/other/?format=rss",
  "https://www.jobs.ac.uk/jobs/pr-marketing-sales-and-communication/?format=rss",
  "https://www.jobs.ac.uk/jobs/project-management-and-consulting/?format=rss",
  "https://www.jobs.ac.uk/jobs/senior-management/?format=rss",
  "https://www.jobs.ac.uk/jobs/sports-and-leisure/?format=rss", // Duplicate of sport-and-leisure, will be named Sports And Leisure
  "https://www.jobs.ac.uk/jobs/student-services/?format=rss",
  "https://www.jobs.ac.uk/jobs/sustainability/?format=rss",
  "https://www.jobs.ac.uk/jobs/web-design-and-development/?format=rss",
  "https://www.jobs.ac.uk/jobs/academic-or-research/?format=rss",
  "https://www.jobs.ac.uk/jobs/clerical/?format=rss",
  "https://www.jobs.ac.uk/jobs/craft-or-manual/?format=rss",
  "https://www.jobs.ac.uk/jobs/masters/?format=rss",
  "https://www.jobs.ac.uk/jobs/phds/?format=rss",
  "https://www.jobs.ac.uk/jobs/professional-or-managerial/?format=rss",
  "https://www.jobs.ac.uk/jobs/technical/?format=rss",
  "https://www.jobs.ac.uk/feeds/subject-areas/law",
  "https://www.jobs.ac.uk/jobs/computer-science/?format=rss", // Duplicate of computer-sciences
  "https://www.jobs.ac.uk/jobs/software-engineering/?format=rss",
  "https://www.jobs.ac.uk/jobs/information-systems/?format=rss",
  "https://www.jobs.ac.uk/jobs/artificial-intelligence/?format=rss",
  "https://www.jobs.ac.uk/jobs/cyber-security/?format=rss",
  "https://www.jobs.ac.uk/feeds/subject-areas/politics-and-government",
  "https://www.jobs.ac.uk/jobs/history/?format=rss",
  "https://www.jobs.ac.uk/jobs/history-of-art/?format=rss",
  "https://www.jobs.ac.uk/jobs/archaeology/?format=rss",
  "https://www.jobs.ac.uk/jobs/philosophy/?format=rss",
  "https://www.jobs.ac.uk/jobs/theology-and-religious-studies/?format=rss",
  "https://www.jobs.ac.uk/jobs/sociology/?format=rss",
  "https://www.jobs.ac.uk/jobs/social-policy/?format=rss",
  "https://www.jobs.ac.uk/jobs/social-work/?format=rss",
  "https://www.jobs.ac.uk/jobs/anthropology/?format=rss",
  "https://www.jobs.ac.uk/jobs/human-and-social-geography/?format=rss",
  "https://www.jobs.ac.uk/jobs/other-social-sciences/?format=rss"
];

export const PREDEFINED_RSS_FEEDS: RssFeed[] = rawRssLinks.map(url => ({
  name: generateFeedName(url),
  url,
})).sort((a, b) => a.name.localeCompare(b.name));


export interface RssFeed {
  name: string;
  url: string;
  type: 'location' | 'subjectArea' | 'jobRole' | 'general' | 'academicLevel'; // Added type
  category?: string; // Broader category e.g., "UK Locations", "Subject Areas"
  categoryDetail: string; // Specific detail, e.g., "London", "Computer Sciences"
}

// Helper to attempt to derive type and categoryDetail from URL structure
function deriveFeedMetadata(url: string): { name: string, type: RssFeed['type'], category: string, categoryDetail: string } {
  let name = "Unknown Feed";
  let type: RssFeed['type'] = 'general';
  let category = "General";
  let categoryDetail = "All";

  try {
    const path = new URL(url).pathname;
    const query = new URL(url).search; // Keep query for exact match if needed

    if (path.startsWith('/jobs/') && query.includes('format=rss')) {
      let segment = path.substring('/jobs/'.length).replace(/\/$/, ''); // Remove /jobs/ and trailing /
      
      // General locations
      const ukLocations = ["london", "midlands-of-england", "northern-england", "northern-ireland", "republic-of-ireland", "scotland", "south-east-england", "south-west-england", "wales"];
      const internationalLocations = ["north-south-and-central-america", "europe", "asia-and-middle-east", "australasia", "africa"];
      
      if (ukLocations.includes(segment)) {
        type = 'location';
        category = 'UK Locations';
        categoryDetail = segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        name = categoryDetail;
      } else if (internationalLocations.includes(segment)) {
        type = 'location';
        category = 'International Locations';
        categoryDetail = segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        name = categoryDetail;
      } 
      // Subject areas
      else if (["agriculture-food-and-veterinary", "architecture-building-and-planning", "biological-sciences", "business-and-management-studies", "computer-sciences", "creative-arts-and-design", "economics", "education-studies-inc-tefl", "engineering-and-technology", "health-and-medical", "historical-and-philosophical-studies", "information-management-and-librarianship", "languages-literature-and-culture", "law", "mathematics-and-statistics", "media-and-communications", "physical-and-environmental-sciences", "politics-and-government", "psychology", "social-sciences-and-social-care", "sport-and-leisure", "computer-science", "software-engineering", "information-systems", "artificial-intelligence", "cyber-security", "history", "history-of-art", "archaeology", "philosophy", "theology-and-religious-studies", "sociology", "social-policy", "social-work", "anthropology", "human-and-social-geography", "other-social-sciences"].includes(segment)) {
        type = 'subjectArea';
        category = 'Subject Areas';
        categoryDetail = segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        name = categoryDetail;
      }
      // Job roles / types
      else if (["administrative", "estates-and-facilities-management", "finance-and-procurement", "fundraising-alumni-bids-and-grants", "health-wellbeing-and-care", "hospitality-retail-conferences-and-events", "human-resources", "international-activities", "it-services", "laboratory-clinical-and-technician", "legal-compliance-and-policy", "library-services-data-and-information-management", "other", "pr-marketing-sales-and-communication", "project-management-and-consulting", "senior-management", "student-services", "sustainability", "web-design-and-development"].includes(segment) || segment === "sports-and-leisure") { // "sports-and-leisure" can be both subject and service
        type = 'jobRole';
        category = 'Professional Services';
        categoryDetail = segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        name = categoryDetail + (segment === "sports-and-leisure" ? " (Services)" : ""); // Differentiate from subject
      }
      // Academic levels
      else if (["academic-or-research", "clerical", "craft-or-manual", "masters", "phds", "professional-or-managerial", "technical"].includes(segment)) {
        type = 'academicLevel';
        category = 'Job Levels / Types';
        categoryDetail = segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        name = categoryDetail;
      }
      // Fallback name if not categorized above
      else {
        name = segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        categoryDetail = name;
      }
    } else if (path.startsWith('/feeds/subject-areas/')) {
      let segment = path.substring('/feeds/subject-areas/'.length).replace(/\/$/, '');
      type = 'subjectArea';
      category = 'Subject Areas (Direct Feeds)';
      categoryDetail = segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      name = categoryDetail;
    } else {
       const segments = path.split('/').filter(Boolean);
       const lastSegment = segments.pop() || 'Unknown Feed';
       name = lastSegment.replace(/[?&].*$/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
       categoryDetail = name;
       if (url.includes("format=rss") && segments.length === 0 && lastSegment === "") { // Root general feed
         name = "All Jobs (General)";
         category = "General";
         categoryDetail = "All";
         type = 'general';
       }
    }
    
    if (name === "Computer Sciences") name = "Computer Science";
    if (name === "Education Studies Inc Tefl") name = "Education Studies (inc. TEFL)";
    if (name === "Languages Literature And Culture") name = "Languages, Literature & Culture";


  } catch (e) {
    console.error("Error generating feed name for URL:", url, e);
    name = "Error Parsing Name";
    categoryDetail = "Error";
  }
  return { name, type, category, categoryDetail };
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
  "https://www.jobs.ac.uk/jobs/sport-and-leisure/?format=rss", // Subject Sport
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
  // "https://www.jobs.ac.uk/jobs/sports-and-leisure/?format=rss", // This is a duplicate URL handled by naming convention in deriveFeedMetadata if we want a "Professional Services" version
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
  "https://www.jobs.ac.uk/jobs/computer-science/?format=rss", // Can be sub-category or primary
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
  "https://www.jobs.ac.uk/jobs/other-social-sciences/?format=rss",
  "https://www.jobs.ac.uk/?format=rss" // General feed
];

// Deduplicate URLs before mapping
const uniqueRawRssLinks = Array.from(new Set(rawRssLinks));

export const PREDEFINED_RSS_FEEDS: RssFeed[] = uniqueRawRssLinks.map(url => {
  const metadata = deriveFeedMetadata(url);
  return {
    url,
    name: metadata.name,
    type: metadata.type,
    category: metadata.category,
    categoryDetail: metadata.categoryDetail
  };
}).sort((a, b) => {
  // Sort by category first, then by name
  if (a.category && b.category && a.category !== b.category) {
    return a.category.localeCompare(b.category);
  }
  return a.name.localeCompare(b.name);
});

// For dropdowns
export const getFeedsByType = (type: RssFeed['type']): RssFeed[] => {
    return PREDEFINED_RSS_FEEDS.filter(feed => feed.type === type);
}
export const getFeedCategoriesByType = (type: RssFeed['type']): string[] => {
    const categories = new Set(PREDEFINED_RSS_FEEDS.filter(feed => feed.type === type).map(feed => feed.category || "Other"));
    return Array.from(categories).sort();
}

export const getFeedDetailsByCategoryAndType = (type: RssFeed['type'], category: string): RssFeed[] => {
    return PREDEFINED_RSS_FEEDS.filter(feed => feed.type === type && feed.category === category).sort((a,b) => a.categoryDetail.localeCompare(b.categoryDetail));
}

// General feeds for "Any" options
export const ALL_SUBJECT_AREAS_URL = "https://www.jobs.ac.uk/jobs/academic-disciplines/?format=rss"; // A broad subject feed
export const ALL_LOCATIONS_URL = "https://www.jobs.ac.uk/?format=rss"; // The most general feed for all locations


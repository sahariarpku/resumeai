
import type { UserProfile, ProfileSectionKey, CustomSection } from './types';
import { DEFAULT_SECTION_ORDER } from './types';

export const TAILOR_RESUME_PREFILL_JD_KEY = "tailorResumePrefillJD";
export const TAILOR_RESUME_PREFILL_RESUME_KEY = "tailorResumePrefillResume";

function formatSectionTitle(title: string): string {
  return title
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function profileToResumeText(profile: UserProfile): string {
  let resumeText = "";
  const sectionOrder = profile.sectionOrder || DEFAULT_SECTION_ORDER;

  if (profile.fullName) {
    resumeText += `# ${profile.fullName}\n`;
    let contactLine = "";
    if (profile.email) contactLine += `${profile.email}`;
    if (profile.phone) contactLine += `${contactLine ? ' | ' : ''}${profile.phone}`;
    if (profile.address) contactLine += `${contactLine ? ' | ' : ''}${profile.address}`;
    if (profile.linkedin) contactLine += `${contactLine ? ' | ' : ''}LinkedIn: ${profile.linkedin}`;
    if (profile.github) contactLine += `${contactLine ? ' | ' : ''}GitHub: ${profile.github}`;
    if (profile.portfolio) contactLine += `${contactLine ? ' | ' : ''}Portfolio: ${profile.portfolio}`;
    if (contactLine) resumeText += `${contactLine}\n`;
    resumeText += "\n";
  }

  if (profile.summary) {
    resumeText += "## Summary\n";
    resumeText += `${profile.summary}\n\n`;
  }

  for (const sectionKey of sectionOrder) {
    switch (sectionKey) {
      case 'workExperiences':
        if (profile.workExperiences && profile.workExperiences.length > 0) {
          resumeText += `## ${formatSectionTitle(sectionKey)}\n`;
          profile.workExperiences.forEach(exp => {
            resumeText += `### ${exp.role} at ${exp.company}\n`;
            resumeText += `*${exp.startDate} - ${exp.endDate || 'Present'}*\n\n`;
            if (exp.description) resumeText += `${exp.description}\n\n`;
            if (exp.achievements && exp.achievements.length > 0) {
              exp.achievements.forEach(ach => resumeText += `* ${ach}\n`);
              resumeText += "\n";
            }
          });
        }
        break;
      case 'education':
        if (profile.education && profile.education.length > 0) {
          resumeText += `## ${formatSectionTitle(sectionKey)}\n`;
          profile.education.forEach(edu => {
            resumeText += `### ${edu.degree} in ${edu.fieldOfStudy}\n`;
            resumeText += `${edu.institution}\n`;
            resumeText += `*${edu.startDate} - ${edu.endDate || 'Expected'}*\n\n`;
            if (edu.gpa) resumeText += `GPA/Result: ${edu.gpa}\n`;
            if (edu.thesisTitle) resumeText += `Thesis: ${edu.thesisTitle}\n`;
            if (edu.relevantCourses && edu.relevantCourses.length > 0) {
              resumeText += `Relevant Courses: ${edu.relevantCourses.join(', ')}\n`;
            }
            if (edu.description) resumeText += `Notes: ${edu.description}\n`;
            resumeText += "\n";
          });
        }
        break;
      case 'projects':
        if (profile.projects && profile.projects.length > 0) {
          resumeText += `## ${formatSectionTitle(sectionKey)}\n`;
          profile.projects.forEach(proj => {
            resumeText += `### ${proj.name}\n`;
            if (proj.link) resumeText += `[Project Link](${proj.link})\n\n`;
            if (proj.description) resumeText += `${proj.description}\n\n`;
            if (proj.technologies && proj.technologies.length > 0) {
              resumeText += `**Technologies:** ${proj.technologies.join(', ')}\n`;
            }
            if (proj.achievements && proj.achievements.length > 0) {
              resumeText += `**Key Achievements:**\n`;
              proj.achievements.forEach(ach => resumeText += `* ${ach}\n`);
            }
            resumeText += "\n";
          });
        }
        break;
      case 'skills':
        if (profile.skills && profile.skills.length > 0) {
          resumeText += `## ${formatSectionTitle(sectionKey)}\n`;
          const categorizedSkills: { [key: string]: string[] } = {};
          const uncategorizedSkills: string[] = [];
          profile.skills.forEach(skill => {
            const skillText = skill.proficiency ? `${skill.name} (${skill.proficiency})` : skill.name;
            if (skill.category) {
              if (!categorizedSkills[skill.category]) {
                categorizedSkills[skill.category] = [];
              }
              categorizedSkills[skill.category].push(skillText);
            } else {
              uncategorizedSkills.push(skillText);
            }
          });
          for (const category in categorizedSkills) {
            resumeText += `**${category}:** ${categorizedSkills[category].join(', ')}\n`;
          }
          if (uncategorizedSkills.length > 0) {
            resumeText += `**Other:** ${uncategorizedSkills.join(', ')}\n`;
          }
          resumeText += "\n";
        }
        break;
      case 'honorsAndAwards':
        if (profile.honorsAndAwards && profile.honorsAndAwards.length > 0) {
          resumeText += `## ${formatSectionTitle(sectionKey)}\n`;
          profile.honorsAndAwards.forEach(item => {
            resumeText += `### ${item.name}\n`;
            if (item.organization) resumeText += `*${item.organization}*\n`;
            if (item.date) resumeText += `*${item.date}*\n`;
            if (item.description) resumeText += `${item.description}\n`;
            resumeText += "\n";
          });
        }
        break;
      case 'publications':
        if (profile.publications && profile.publications.length > 0) {
          resumeText += `## ${formatSectionTitle(sectionKey)}\n`;
          profile.publications.forEach(item => {
            resumeText += `### ${item.title}\n`;
            if (item.authors && item.authors.length > 0) resumeText += `**Authors:** ${item.authors.join(', ')}\n`;
            if (item.journalOrConference) resumeText += `*${item.journalOrConference}*\n`;
            if (item.publicationDate) resumeText += `*${item.publicationDate}*\n`;
            if (item.doi) resumeText += `DOI: ${item.doi}\n`;
            if (item.link) resumeText += `[Publication Link](${item.link})\n`;
            if (item.description) resumeText += `\n${item.description}\n`;
            resumeText += "\n";
          });
        }
        break;
      case 'certifications':
        if (profile.certifications && profile.certifications.length > 0) {
          resumeText += `## ${formatSectionTitle(sectionKey)}\n`;
          profile.certifications.forEach(cert => {
            resumeText += `### ${cert.name}\n`;
            resumeText += `*${cert.issuingOrganization} - Issued: ${cert.issueDate}*\n`;
            if (cert.credentialId) resumeText += `Credential ID: ${cert.credentialId}\n`;
            if (cert.credentialUrl) resumeText += `[Verify Credential](${cert.credentialUrl})\n`;
            resumeText += "\n";
          });
        }
        break;
      case 'references':
        if (profile.references && profile.references.length > 0) {
          resumeText += `## ${formatSectionTitle(sectionKey)}\n`;
          profile.references.forEach(ref => {
            resumeText += `### ${ref.name}\n`;
            if (ref.titleAndCompany) resumeText += `*${ref.titleAndCompany}*\n`;
            if (ref.contactDetailsOrNote) resumeText += `${ref.contactDetailsOrNote}\n`;
            resumeText += "\n";
          });
        }
        break;
      case 'customSections':
        if (profile.customSections && profile.customSections.length > 0) {
          profile.customSections.forEach((section: CustomSection) => {
            resumeText += `## ${section.heading.toUpperCase()}\n`; // Using toUpperCase for consistency with other section titles
            resumeText += `${section.content}\n\n`;
          });
        }
        break;
    }
  }
  return resumeText.trim();
}

const PROFESSIONAL_DOCUMENT_STYLES = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap');
    
    body { 
      font-family: 'Source Serif 4', serif; 
      line-height: 1.6; 
      margin: 0; 
      padding: 0; 
      color: #333333; 
      background-color: #ffffff;
      font-size: 11pt;
    }
    .container { 
      max-width: 8.5in; 
      margin: 0.5in auto; 
      padding: 0.75in; 
      border: 1px solid #dcdcdc; 
      box-shadow: 0 0 10px rgba(0,0,0,0.05);
    }
    
    h1.main-name { 
      font-family: 'Inter', sans-serif;
      font-size: 24pt; 
      font-weight: 700;
      margin-bottom: 0.1em; 
      color: #1a1a1a; 
      text-align: center;
      letter-spacing: 1px;
    }
    
    .contact-info { 
      text-align: center;
      margin-bottom: 1.5em; 
      font-size: 10pt; 
      color: #4d4d4d; 
      font-family: 'Inter', sans-serif;
    }
    .contact-info a { color: #0056b3; text-decoration: none; }
    .contact-info a:hover { text-decoration: underline; }
    .contact-info span + span::before { content: " | "; margin: 0 0.5em; }

    .section-title { 
      font-family: 'Inter', sans-serif;
      font-size: 14pt; 
      font-weight: 600;
      margin-top: 1.2em; 
      margin-bottom: 0.6em; 
      border-bottom: 1.5px solid #333333; 
      padding-bottom: 0.25em; 
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section-summary .section-title { /* Summary specific title styling */
      text-align: left; 
    }
    .document-body .section-title { /* For AI generated content's main sections */
      /* Styles inherited */
    }
     .document-body h3.item-primary { /* For AI generated content's sub-sections */
      font-family: 'Inter', sans-serif;
      font-size: 12pt; 
      font-weight: 600; 
      color: #2a2a2a;
      margin-top: 0.8em;
      margin-bottom: 0.3em;
    }


    .item { margin-bottom: 1.2em; }
    .item-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.1em; }
    .item-primary { font-family: 'Inter', sans-serif; font-size: 11pt; font-weight: 600; color: #2a2a2a; }
    .item-secondary { font-family: 'Inter', sans-serif; font-size: 10pt; font-weight: 500; color: #4d4d4d; } /* For company, institution */
    .item-dates { font-family: 'Inter', sans-serif; font-size: 10pt; color: #4d4d4d; text-align: right; white-space: nowrap; }
    
    .item-details p, .item-details ul { margin-top: 0.3em; margin-bottom: 0.3em; font-size: 10.5pt; }
    .item-details ul { padding-left: 1.5em; list-style-type: disc; }
    .item-details li { margin-bottom: 0.25em; }
    
    .description { font-size: 10.5pt; margin-top: 0.2em; }
    
    .skills-list { padding: 0; list-style-type: none; }
    .skills-list li { margin-bottom: 0.4em; }
    .skills-category strong { font-family: 'Inter', sans-serif; font-weight: 600; text-transform: none; }
    
    .publication-authors { font-style: italic; font-size: 10pt; margin-top: 0.1em; margin-bottom: 0.1em; }
    .publication-source { font-size: 10pt; margin-bottom: 0.1em; }
    
    .document-body p { margin-bottom: 0.8em; } /* Spacing for paragraphs in AI generated content */
    .document-body ul { margin-top: 0.2em; margin-bottom: 0.8em; padding-left: 1.5em; list-style-type: disc; }
    .document-body li { margin-bottom: 0.25em; }


    /* Print-specific styles */
    @media print {
      body { font-size: 10pt; }
      .container { 
        margin: 0; 
        padding: 0.5in; 
        border: none; 
        box-shadow: none; 
        max-width: 100%;
      }
      h1.main-name { font-size: 22pt; }
      .section-title { font-size: 13pt; }
      .item-primary, .item-secondary, .item-dates { font-size: 9.5pt; }
      .item-details p, .item-details ul, .description { font-size: 9.5pt; }
      .document-body p, .document-body ul { font-size: 9.5pt; }
      .contact-info { font-size: 9pt; }
      a { color: #000000 !important; text-decoration: none !important; } /* Ensure links are black for printing */
      .item { page-break-inside: avoid; }
    }
  </style>
`;


export function profileToResumeHtml(profile: UserProfile): string {
  let html = `
    <!DOCTYPE html>
    <html xmlns:v="urn:schemas-microsoft-com:vml"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:w="urn:schemas-microsoft-com:office:word"
    xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
    xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <title>${profile.fullName ? `${profile.fullName} - Resume` : 'Resume'}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>90</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      ${PROFESSIONAL_DOCUMENT_STYLES}
    </head>
    <body>
      <div class="container">
  `;

  if (profile.fullName) {
    html += `<h1 class="main-name">${profile.fullName}</h1>`;
    let contactParts: string[] = [];
    if (profile.email) contactParts.push(`<a href="mailto:${profile.email}">${profile.email}</a>`);
    if (profile.phone) contactParts.push(`<span>${profile.phone}</span>`);
    if (profile.address) contactParts.push(`<span>${profile.address}</span>`);
    if (profile.linkedin) contactParts.push(`<a href="${profile.linkedin}" target="_blank">LinkedIn</a>`);
    if (profile.github) contactParts.push(`<a href="${profile.github}" target="_blank">GitHub</a>`);
    if (profile.portfolio) contactParts.push(`<a href="${profile.portfolio}" target="_blank">Portfolio</a>`);
    if (contactParts.length > 0) html += `<p class="contact-info">${contactParts.join('<span></span>')}</p>`;
  }

  if (profile.summary) {
    html += `<div class="section section-summary"><h2 class="section-title">Summary</h2><div class="item-details"><p>${profile.summary.replace(/\n/g, '<br>')}</p></div></div>`;
  }

  const sectionOrder = profile.sectionOrder || DEFAULT_SECTION_ORDER;

  for (const sectionKey of sectionOrder) {
    html += `<div class="section">`; // Each section gets a wrapper
    switch (sectionKey) {
      case 'workExperiences':
        if (profile.workExperiences && profile.workExperiences.length > 0) {
          html += `<h2 class="section-title">${formatSectionTitle(sectionKey)}</h2>`;
          profile.workExperiences.forEach(exp => {
            html += `<div class="item">`;
            html += `<div class="item-header">
                        <div>
                           <div class="item-primary">${exp.role}</div>
                           <div class="item-secondary">${exp.company}</div>
                        </div>
                        <div class="item-dates">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                     </div>`;
            html += `<div class="item-details">`;
            if (exp.description) html += `<p>${exp.description.replace(/\n/g, '<br>')}</p>`;
            if (exp.achievements && exp.achievements.length > 0) {
              html += `<ul>`;
              exp.achievements.forEach(ach => html += `<li>${ach}</li>`);
              html += `</ul>`;
            }
            html += `</div></div>`; // Close item
          });
        }
        break;
      case 'education':
        if (profile.education && profile.education.length > 0) {
          html += `<h2 class="section-title">${formatSectionTitle(sectionKey)}</h2>`;
          profile.education.forEach(edu => {
            html += `<div class="item">`;
            html += `<div class="item-header">
                        <div>
                          <div class="item-primary">${edu.degree} in ${edu.fieldOfStudy}</div>
                          <div class="item-secondary">${edu.institution}</div>
                        </div>
                        <div class="item-dates">${edu.startDate} - ${edu.endDate || 'Expected'}</div>
                     </div>`;
            html += `<div class="item-details">`;
            if (edu.gpa) html += `<p>GPA/Result: ${edu.gpa}</p>`;
            if (edu.thesisTitle) html += `<p>Thesis: ${edu.thesisTitle}</p>`;
            if (edu.relevantCourses && edu.relevantCourses.length > 0) {
              html += `<p>Relevant Courses: ${edu.relevantCourses.join(', ')}</p>`;
            }
            if (edu.description) html += `<p>${edu.description.replace(/\n/g, '<br>')}</p>`;
            html += `</div></div>`; // Close item
          });
        }
        break;
      case 'projects':
        if (profile.projects && profile.projects.length > 0) {
          html += `<h2 class="section-title">${formatSectionTitle(sectionKey)}</h2>`;
          profile.projects.forEach(proj => {
            html += `<div class="item">`;
            html += `<div class="item-header">
                          <div class="item-primary">${proj.name} ${proj.link ? `| <a href="${proj.link}" target="_blank">Link</a>` : ''}</div>
                      </div>`;
            html += `<div class="item-details">`;
            if (proj.description) html += `<p>${proj.description.replace(/\n/g, '<br>')}</p>`;
            if (proj.technologies && proj.technologies.length > 0) {
              html += `<p><strong>Technologies:</strong> ${proj.technologies.join(', ')}</p>`;
            }
            if (proj.achievements && proj.achievements.length > 0) {
              html += `<p><strong>Key Achievements:</strong></p><ul>`;
              proj.achievements.forEach(ach => html += `<li>${ach}</li>`);
              html += `</ul>`;
            }
            html += `</div></div>`; // Close item
          });
        }
        break;
      case 'skills':
        if (profile.skills && profile.skills.length > 0) {
          html += `<h2 class="section-title">${formatSectionTitle(sectionKey)}</h2>`;
          html += `<ul class="skills-list item-details">`; // item-details for consistent font size
          const categorizedSkills: { [key: string]: string[] } = {};
          const uncategorizedSkills: string[] = [];
          profile.skills.forEach(skill => {
            const skillText = skill.proficiency ? `${skill.name} (${skill.proficiency})` : skill.name;
            if (skill.category) {
              if (!categorizedSkills[skill.category]) {
                categorizedSkills[skill.category] = [];
              }
              categorizedSkills[skill.category].push(skillText);
            } else {
              uncategorizedSkills.push(skillText);
            }
          });
          for (const category in categorizedSkills) {
            html += `<li><span class="skills-category"><strong>${category}:</strong></span> ${categorizedSkills[category].join(', ')}</li>`;
          }
          if (uncategorizedSkills.length > 0) {
            html += `<li><span class="skills-category"><strong>Other:</strong></span> ${uncategorizedSkills.join(', ')}</li>`;
          }
          html += `</ul>`;
        }
        break;
      case 'honorsAndAwards':
        if (profile.honorsAndAwards && profile.honorsAndAwards.length > 0) {
          html += `<h2 class="section-title">${formatSectionTitle(sectionKey)}</h2>`;
          profile.honorsAndAwards.forEach(item => {
            html += `<div class="item">`;
             html += `<div class="item-header">
                        <div>
                          <div class="item-primary">${item.name}</div>
                          ${item.organization ? `<div class="item-secondary">${item.organization}</div>` : ''}
                        </div>
                        ${item.date ? `<div class="item-dates">${item.date}</div>` : ''}
                     </div>`;
            if (item.description) html += `<div class="item-details"><p>${item.description.replace(/\n/g, '<br>')}</p></div>`;
            html += `</div>`; // Close item
          });
        }
        break;
      case 'publications':
        if (profile.publications && profile.publications.length > 0) {
          html += `<h2 class="section-title">${formatSectionTitle(sectionKey)}</h2>`;
          profile.publications.forEach(item => {
            html += `<div class="item">`;
            html += `<div class="item-header">
                          <div class="item-primary">${item.title}</div>
                          ${item.publicationDate ? `<div class="item-dates">${item.publicationDate}</div>` : ''}
                      </div>`;
            html += `<div class="item-details">`;
            if (item.authors && item.authors.length > 0) html += `<p class="publication-authors">${item.authors.join(', ')}</p>`;
            if (item.journalOrConference) html += `<p class="publication-source">${item.journalOrConference}</p>`;
            if (item.doi) html += `<p>DOI: ${item.doi}</p>`;
            if (item.link) html += `<p><a href="${item.link}" target="_blank">View Publication</a></p>`;
            if (item.description) html += `<p>${item.description.replace(/\n/g, '<br>')}</p>`;
            html += `</div></div>`; // Close item
          });
        }
        break;
      case 'certifications':
        if (profile.certifications && profile.certifications.length > 0) {
          html += `<h2 class="section-title">${formatSectionTitle(sectionKey)}</h2>`;
          profile.certifications.forEach(cert => {
            html += `<div class="item">`;
            html += `<div class="item-header">
                          <div>
                            <div class="item-primary">${cert.name}</div>
                            <div class="item-secondary">${cert.issuingOrganization}</div>
                          </div>
                          <div class="item-dates">Issued: ${cert.issueDate}</div>
                      </div>`;
            html += `<div class="item-details">`;
            if (cert.credentialId) html += `<p>Credential ID: ${cert.credentialId}</p>`;
            if (cert.credentialUrl) html += `<p><a href="${cert.credentialUrl}" target="_blank">Verify Credential</a></p>`;
            html += `</div></div>`; // Close item
          });
        }
        break;
      case 'references':
         if (profile.references && profile.references.length > 0) {
          html += `<h2 class="section-title">${formatSectionTitle(sectionKey)}</h2>`;
          profile.references.forEach(ref => {
            html += `<div class="item">`;
            html += `<div class="item-primary">${ref.name}</div>`;
            html += `<div class="item-details">`;
            if (ref.titleAndCompany) html += `<p class="item-secondary">${ref.titleAndCompany}</p>`;
            if (ref.contactDetailsOrNote) html += `<p>${ref.contactDetailsOrNote.replace(/\n/g, '<br>')}</p>`;
            html += `</div></div>`; // Close item
          });
        }
        break;
      case 'customSections':
        if (profile.customSections && profile.customSections.length > 0) {
          profile.customSections.forEach((section: CustomSection) => {
            // Wrap custom section in its own div.section for consistent spacing if needed
            html += `<h2 class="section-title">${section.heading.toUpperCase()}</h2><div class="item-details"><p>${section.content.replace(/\n/g, '<br>')}</p></div>`;
          });
        }
        break;
    }
    html += `</div>`; // Close section wrapper
  }

  html += `
      </div>
    </body>
    </html>
  `;
  return html;
}


export function textToProfessionalHtml(text: string, documentTitle: string): string {
  let htmlBodyContent = '';
  const lines = text.split('\n');
  let inList = false;

  lines.forEach(line => {
    line = line.trimRight(); // Trim trailing spaces which might affect parsing

    // Basic Markdown to HTML conversion
    if (line.startsWith('### ')) {
      if (inList) { htmlBodyContent += '</ul>\n'; inList = false; }
      // Style for h3 from AI content should be less prominent than main section titles
      htmlBodyContent += `<h3 class="item-primary" style="font-size: 11pt; font-weight: 600; margin-top: 0.7em; margin-bottom: 0.2em;">${line.substring(4)}</h3>\n`;
    } else if (line.startsWith('## ')) {
      if (inList) { htmlBodyContent += '</ul>\n'; inList = false; }
      // Use section-title style for main sections from AI
      htmlBodyContent += `<h2 class="section-title">${line.substring(3)}</h2>\n`;
    } else if (line.startsWith('# ')) { // Less likely for body content, more for a document title
      if (inList) { htmlBodyContent += '</ul>\n'; inList = false; }
      htmlBodyContent += `<h1 class="main-name" style="text-align:left; font-size: 18pt; margin-bottom: 0.5em;">${line.substring(2)}</h1>\n`;
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      if (!inList) {
        htmlBodyContent += '<ul style="margin-top: 0.2em; margin-bottom: 0.5em;">\n';
        inList = true;
      }
      let listItem = line.substring(line.startsWith('* ') ? 2 : (line.startsWith('- ') ? 2 : 0));
      listItem = listItem.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<strong>$1</strong>');
      listItem = listItem.replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/_(.*?)_/g, '<em>$1</em>');
      htmlBodyContent += `  <li>${listItem}</li>\n`;
    } else if (line.trim() === '') {
      if (inList) { htmlBodyContent += '</ul>\n'; inList = false; }
      // Avoid excessive <br> tags; paragraphs handle spacing.
      // Consider if a <br> is truly needed or if it's just an empty line for paragraph separation.
      // If the previous content was not a list, a new paragraph will start, effectively creating space.
    } else {
      if (inList) { htmlBodyContent += '</ul>\n'; inList = false; }
      let pLine = line;
      pLine = pLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      pLine = pLine.replace(/__(.*?)__/g, '<strong>$1</strong>');
      pLine = pLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
      pLine = pLine.replace(/_(.*?)_/g, '<em>$1</em>');
      htmlBodyContent += `<p>${pLine}</p>\n`;
    }
  });

  if (inList) {
    htmlBodyContent += '</ul>\n';
  }

  // Clean up potentially empty paragraphs that might arise from multiple empty lines in source
  htmlBodyContent = htmlBodyContent.replace(/<p>\s*<\/p>/g, '');
  // Consolidate multiple <br> tags if they were aggressively added (though current logic avoids this)
  htmlBodyContent = htmlBodyContent.replace(/(<br\s*\/?>\s*){2,}/gi, '<br>\n');


  return `
    <!DOCTYPE html>
    <html xmlns:v="urn:schemas-microsoft-com:vml"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:w="urn:schemas-microsoft-com:office:word"
    xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
    xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <title>${documentTitle}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>90</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      ${PROFESSIONAL_DOCUMENT_STYLES}
    </head>
    <body>
      <div class="container">
        <div class="section document-body">
          ${documentTitle && !text.trim().toLowerCase().startsWith(documentTitle.trim().toLowerCase().split(" ")[0].toLowerCase()) && !text.trim().startsWith("# ") && !text.trim().startsWith("## ")
            ? `<h2 class="section-title" style="text-align:center; border-bottom: none; margin-bottom: 1.5em;">${documentTitle}</h2>`
            : ''
          }
          <div class="item-details">
            ${htmlBodyContent}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

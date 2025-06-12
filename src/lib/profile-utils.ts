
import type { UserProfile, ProfileSectionKey, CustomSection } from './types';
import { DEFAULT_SECTION_ORDER } from './types';

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
            resumeText += `## ${section.heading.toUpperCase()}\n`;
            resumeText += `${section.content}\n\n`;
          });
        }
        break;
    }
  }
  return resumeText.trim();
}


export function profileToResumeHtml(profile: UserProfile): string {
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${profile.fullName ? `${profile.fullName} - Resume` : 'Resume'}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; color: #333; }
        .container { max-width: 800px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; }
        h1 { font-size: 2em; margin-bottom: 0.2em; color: #111; }
        h2 { font-size: 1.5em; margin-top: 1em; margin-bottom: 0.5em; border-bottom: 1px solid #eee; padding-bottom: 0.2em; color: #222; }
        h3 { font-size: 1.2em; margin-top: 0.8em; margin-bottom: 0.3em; color: #333; }
        p, li { margin-bottom: 0.5em; }
        ul { padding-left: 20px; margin-top:0; }
        .contact-info { margin-bottom: 1em; font-size: 0.9em; color: #555; }
        .contact-info a { color: #007bff; text-decoration: none; }
        .contact-info a:hover { text-decoration: underline; }
        .section { margin-bottom: 1.5em; }
        .item { margin-bottom: 1em; }
        .item-title { font-weight: bold; }
        .item-subtitle { font-style: italic; color: #555; font-size: 0.95em; }
        .item-dates { font-style: italic; color: #555; font-size: 0.9em; }
        .description { margin-top: 0.3em; }
        .achievements { margin-top: 0.3em; }
        .skills-category { margin-bottom: 0.5em; }
        .skills-category strong { text-transform: capitalize; }
      </style>
    </head>
    <body>
      <div class="container">
  `;

  if (profile.fullName) {
    html += `<h1>${profile.fullName}</h1>`;
    let contactLine = "";
    if (profile.email) contactLine += `<a href="mailto:${profile.email}">${profile.email}</a>`;
    if (profile.phone) contactLine += `${contactLine ? ' | ' : ''}${profile.phone}`;
    if (profile.address) contactLine += `${contactLine ? ' | ' : ''}${profile.address}`;
    if (profile.linkedin) contactLine += `${contactLine ? ' | ' : ''}<a href="${profile.linkedin}" target="_blank">LinkedIn</a>`;
    if (profile.github) contactLine += `${contactLine ? ' | ' : ''}<a href="${profile.github}" target="_blank">GitHub</a>`;
    if (profile.portfolio) contactLine += `${contactLine ? ' | ' : ''}<a href="${profile.portfolio}" target="_blank">Portfolio</a>`;
    if (contactLine) html += `<p class="contact-info">${contactLine}</p>`;
  }

  if (profile.summary) {
    html += `<div class="section"><h2>Summary</h2><p>${profile.summary.replace(/\n/g, '<br>')}</p></div>`;
  }

  const sectionOrder = profile.sectionOrder || DEFAULT_SECTION_ORDER;

  for (const sectionKey of sectionOrder) {
    html += `<div class="section">`;
    switch (sectionKey) {
      case 'workExperiences':
        if (profile.workExperiences && profile.workExperiences.length > 0) {
          html += `<h2>${formatSectionTitle(sectionKey)}</h2>`;
          profile.workExperiences.forEach(exp => {
            html += `<div class="item">`;
            html += `<p class="item-title">${exp.role} at ${exp.company}</p>`;
            html += `<p class="item-dates">${exp.startDate} - ${exp.endDate || 'Present'}</p>`;
            if (exp.description) html += `<p class="description">${exp.description.replace(/\n/g, '<br>')}</p>`;
            if (exp.achievements && exp.achievements.length > 0) {
              html += `<ul class="achievements">`;
              exp.achievements.forEach(ach => html += `<li>${ach}</li>`);
              html += `</ul>`;
            }
            html += `</div>`;
          });
        }
        break;
      case 'education':
        if (profile.education && profile.education.length > 0) {
          html += `<h2>${formatSectionTitle(sectionKey)}</h2>`;
          profile.education.forEach(edu => {
            html += `<div class="item">`;
            html += `<p class="item-title">${edu.degree} in ${edu.fieldOfStudy}</p>`;
            html += `<p class="item-subtitle">${edu.institution}</p>`;
            html += `<p class="item-dates">${edu.startDate} - ${edu.endDate || 'Expected'}</p>`;
            if (edu.gpa) html += `<p>GPA/Result: ${edu.gpa}</p>`;
            if (edu.thesisTitle) html += `<p>Thesis: ${edu.thesisTitle}</p>`;
            if (edu.relevantCourses && edu.relevantCourses.length > 0) {
              html += `<p>Relevant Courses: ${edu.relevantCourses.join(', ')}</p>`;
            }
            if (edu.description) html += `<p class="description">Notes: ${edu.description.replace(/\n/g, '<br>')}</p>`;
            html += `</div>`;
          });
        }
        break;
      case 'projects':
        if (profile.projects && profile.projects.length > 0) {
          html += `<h2>${formatSectionTitle(sectionKey)}</h2>`;
          profile.projects.forEach(proj => {
            html += `<div class="item">`;
            html += `<p class="item-title">${proj.name}`;
            if (proj.link) html += ` | <a href="${proj.link}" target="_blank">Link</a>`;
            html += `</p>`;
            if (proj.description) html += `<p class="description">${proj.description.replace(/\n/g, '<br>')}</p>`;
            if (proj.technologies && proj.technologies.length > 0) {
              html += `<p><strong>Technologies:</strong> ${proj.technologies.join(', ')}</p>`;
            }
            if (proj.achievements && proj.achievements.length > 0) {
              html += `<p><strong>Key Achievements:</strong></p><ul class="achievements">`;
              proj.achievements.forEach(ach => html += `<li>${ach}</li>`);
              html += `</ul>`;
            }
            html += `</div>`;
          });
        }
        break;
      case 'skills':
        if (profile.skills && profile.skills.length > 0) {
          html += `<h2>${formatSectionTitle(sectionKey)}</h2>`;
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
            html += `<p class="skills-category"><strong>${category}:</strong> ${categorizedSkills[category].join(', ')}</p>`;
          }
          if (uncategorizedSkills.length > 0) {
            html += `<p class="skills-category"><strong>Other:</strong> ${uncategorizedSkills.join(', ')}</p>`;
          }
        }
        break;
      case 'honorsAndAwards':
        if (profile.honorsAndAwards && profile.honorsAndAwards.length > 0) {
          html += `<h2>${formatSectionTitle(sectionKey)}</h2>`;
          profile.honorsAndAwards.forEach(item => {
            html += `<div class="item">`;
            html += `<p class="item-title">${item.name}</p>`;
            if (item.organization) html += `<p class="item-subtitle">${item.organization}</p>`;
            if (item.date) html += `<p class="item-dates">${item.date}</p>`;
            if (item.description) html += `<p class="description">${item.description.replace(/\n/g, '<br>')}</p>`;
            html += `</div>`;
          });
        }
        break;
      case 'publications':
        if (profile.publications && profile.publications.length > 0) {
          html += `<h2>${formatSectionTitle(sectionKey)}</h2>`;
          profile.publications.forEach(item => {
            html += `<div class="item">`;
            html += `<p class="item-title">${item.title}</p>`;
            if (item.authors && item.authors.length > 0) html += `<p><strong>Authors:</strong> ${item.authors.join(', ')}</p>`;
            if (item.journalOrConference) html += `<p class="item-subtitle">${item.journalOrConference}</p>`;
            if (item.publicationDate) html += `<p class="item-dates">${item.publicationDate}</p>`;
            if (item.doi) html += `<p>DOI: ${item.doi}</p>`;
            if (item.link) html += `<p><a href="${item.link}" target="_blank">Publication Link</a></p>`;
            if (item.description) html += `<p class="description">${item.description.replace(/\n/g, '<br>')}</p>`;
            html += `</div>`;
          });
        }
        break;
      case 'certifications':
        if (profile.certifications && profile.certifications.length > 0) {
          html += `<h2>${formatSectionTitle(sectionKey)}</h2>`;
          profile.certifications.forEach(cert => {
            html += `<div class="item">`;
            html += `<p class="item-title">${cert.name}</p>`;
            html += `<p class="item-subtitle">${cert.issuingOrganization} - Issued: ${cert.issueDate}</p>`;
            if (cert.credentialId) html += `<p>Credential ID: ${cert.credentialId}</p>`;
            if (cert.credentialUrl) html += `<p><a href="${cert.credentialUrl}" target="_blank">Verify Credential</a></p>`;
            html += `</div>`;
          });
        }
        break;
      case 'references':
         if (profile.references && profile.references.length > 0) {
          html += `<h2>${formatSectionTitle(sectionKey)}</h2>`;
          profile.references.forEach(ref => {
            html += `<div class="item">`;
            html += `<p class="item-title">${ref.name}</p>`;
            if (ref.titleAndCompany) html += `<p class="item-subtitle">${ref.titleAndCompany}</p>`;
            if (ref.contactDetailsOrNote) html += `<p>${ref.contactDetailsOrNote.replace(/\n/g, '<br>')}</p>`;
            html += `</div>`;
          });
        }
        break;
      case 'customSections':
        if (profile.customSections && profile.customSections.length > 0) {
          profile.customSections.forEach((section: CustomSection) => {
            html += `<div class="section"><h2>${section.heading.toUpperCase()}</h2><p>${section.content.replace(/\n/g, '<br>')}</p></div>`;
          });
        }
        break;
    }
    html += `</div>`;
  }

  html += `
      </div>
    </body>
    </html>
  `;
  return html;
}

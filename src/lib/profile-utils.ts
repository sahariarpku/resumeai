
import type { UserProfile } from './types';

export function profileToResumeText(profile: UserProfile): string {
  let resumeText = "";

  if (profile.fullName) {
    resumeText += `${profile.fullName}\n`;
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
    resumeText += "SUMMARY\n";
    resumeText += "--------------------\n";
    resumeText += `${profile.summary}\n\n`;
  }

  if (profile.workExperiences && profile.workExperiences.length > 0) {
    resumeText += "WORK EXPERIENCE\n";
    resumeText += "--------------------\n";
    profile.workExperiences.forEach(exp => {
      resumeText += `${exp.role.toUpperCase()} | ${exp.company}\n`;
      resumeText += `${exp.startDate} - ${exp.endDate || 'Present'}\n`;
      if (exp.description) resumeText += `${exp.description}\n`;
      if (exp.achievements && exp.achievements.length > 0) {
        exp.achievements.forEach(ach => resumeText += `- ${ach}\n`);
      }
      resumeText += "\n";
    });
  }
  
  if (profile.education && profile.education.length > 0) {
    resumeText += "EDUCATION\n";
    resumeText += "--------------------\n";
    profile.education.forEach(edu => {
      resumeText += `${edu.degree} in ${edu.fieldOfStudy}\n`;
      resumeText += `${edu.institution}\n`;
      resumeText += `${edu.startDate} - ${edu.endDate || 'Expected'}\n`;
      if (edu.gpa) resumeText += `GPA/Result: ${edu.gpa}\n`;
      if (edu.thesisTitle) resumeText += `Thesis: ${edu.thesisTitle}\n`;
      if (edu.relevantCourses && edu.relevantCourses.length > 0) {
        resumeText += `Relevant Courses: ${edu.relevantCourses.join(', ')}\n`;
      }
      if (edu.description) resumeText += `Notes: ${edu.description}\n`;
      resumeText += "\n";
    });
  }
  
  if (profile.projects && profile.projects.length > 0) {
    resumeText += "PROJECTS\n";
    resumeText += "--------------------\n";
    profile.projects.forEach(proj => {
      resumeText += `${proj.name.toUpperCase()}\n`;
      if (proj.description) resumeText += `${proj.description}\n`;
      if (proj.technologies && proj.technologies.length > 0) {
        resumeText += `Technologies: ${proj.technologies.join(', ')}\n`;
      }
      if (proj.link) resumeText += `Link: ${proj.link}\n`;
      if (proj.achievements && proj.achievements.length > 0) {
        proj.achievements.forEach(ach => resumeText += `- ${ach}\n`);
      }
      resumeText += "\n";
    });
  }

  if (profile.skills && profile.skills.length > 0) {
    resumeText += "SKILLS\n";
    resumeText += "--------------------\n";
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
      resumeText += `${category.toUpperCase()}: ${categorizedSkills[category].join(', ')}\n`;
    }
    if (uncategorizedSkills.length > 0) {
      if (Object.keys(categorizedSkills).length > 0) resumeText += "OTHER: ";
      else resumeText += "GENERAL: "
      resumeText += `${uncategorizedSkills.join(', ')}\n`;
    }
    resumeText += "\n";
  }
  
  if (profile.honorsAndAwards && profile.honorsAndAwards.length > 0) {
    resumeText += "HONORS & AWARDS\n";
    resumeText += "--------------------\n";
    profile.honorsAndAwards.forEach(item => {
      resumeText += `${item.name}\n`;
      if (item.organization) resumeText += `From: ${item.organization}\n`;
      if (item.date) resumeText += `Date: ${item.date}\n`;
      if (item.description) resumeText += `${item.description}\n`;
      resumeText += "\n";
    });
  }

  if (profile.publications && profile.publications.length > 0) {
    resumeText += "PUBLICATIONS\n";
    resumeText += "--------------------\n";
    profile.publications.forEach(item => {
      resumeText += `${item.title}\n`;
      if (item.authors && item.authors.length > 0) resumeText += `Authors: ${item.authors.join(', ')}\n`;
      if (item.journalOrConference) resumeText += `Venue: ${item.journalOrConference}\n`;
      if (item.publicationDate) resumeText += `Date: ${item.publicationDate}\n`;
      if (item.doi) resumeText += `DOI: ${item.doi}\n`;
      if (item.link) resumeText += `Link: ${item.link}\n`;
      if (item.description) resumeText += `Abstract/Summary: ${item.description}\n`;
      resumeText += "\n";
    });
  }

  if (profile.certifications && profile.certifications.length > 0) {
    resumeText += "CERTIFICATIONS\n";
    resumeText += "--------------------\n";
    profile.certifications.forEach(cert => {
      resumeText += `${cert.name} - ${cert.issuingOrganization} (${cert.issueDate})\n`;
      if (cert.credentialId) resumeText += `ID: ${cert.credentialId}\n`;
      if (cert.credentialUrl) resumeText += `URL: ${cert.credentialUrl}\n`;
      resumeText += "\n";
    });
  }

  return resumeText.trim();
}

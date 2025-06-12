
import type { UserProfile, WorkExperience, Project, Education, Skill, Certification } from './types';

export function profileToResumeText(profile: UserProfile): string {
  let resumeText = "";

  if (profile.fullName) {
    resumeText += `${profile.fullName}\n`;
    let contactLine = "";
    if (profile.email) contactLine += `${profile.email}`;
    if (profile.phone) contactLine += `${contactLine ? ' | ' : ''}${profile.phone}`;
    if (profile.address) contactLine += `${contactLine ? ' | ' : ''}${profile.address}`; // Added address
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
        // resumeText += "Key Achievements:\n";
        exp.achievements.forEach(ach => resumeText += `- ${ach}\n`);
      }
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
        // resumeText += "Key Highlights:\n";
        proj.achievements.forEach(ach => resumeText += `- ${ach}\n`);
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
      resumeText += `${edu.startDate} - ${edu.endDate || 'Expected'}\n\n`;
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

    
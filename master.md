# CarStreets AI-Powered Social Content Engine

## Overview
CarStreets is an AI-driven platform designed to automate content generation, editing, approval, and distribution tailored for automotive dealerships. It integrates multiple agents handling market research, content strategy, image and text generation, quality control, and multi-platform publishing.

---

## Core Functionalities

- **Multi-Agent Pipeline:** Orchestrates agents for research, content generation, quality assurance, and distribution.
- **Centralized Prompt System:** Produces platform-specific, seasonally aware, branded prompts.
- **Multi-Image Input:** Supports multiple car images per generation to enhance content richness.
- **Image Generation & Editing:** Utilizes fal.ai's `nano-banana` model (image-to-image editing).
- **Quality Monitoring:** Incorporates prompt quality metrics and monitors generation success.
- **Approval Workflow:** Enables manual review & approval before scheduled or instant social media posts.
- **Authentication & Security:** Enforced via token-based guardrails and Vercel bypass headers.

---

## Tools & Integrations

| Tool/Library          | Purpose                                               | Notes/Future Options                              |
|----------------------|-------------------------------------------------------|--------------------------------------------------|
| **fal.ai**            | AI model serving for text and image generation/editing | `nano-banana` image-to-image editing, vision models |
| **Prisma ORM**         | Database modeling & querying                          | Manages dealer profiles, content, images         |
| **Cloudinary**         | Image storage & CDN                                  | Hosts car photographs, organized by angle        |
| **OpenAI API**         | Text generation & prompt enhancements               | GPT-based content for posts & captions            |
| **Next.js (App router)** | Backend API & frontend framework                      | Serverless endpoints for generation & pipeline    |
| **Authentication Layer**| API token & header verification                      | Secures admin and content APIs                     |
| **Social Media APIs (planned)** | Facebook Graph, Instagram, LinkedIn                  | Automate posting, scheduling & analytics           |
| **WhatsApp Business API (planned)** | Bulk messaging with compliance and user opt-in       | Extends marketing to messaging platforms          |

---

## Component Highlights

- **Prompt Center (`car-prompt-generator.ts`):** Centralized generation & refinement of prompts per platform and season.
- **Thumbnail Route (`/api/admin/thumbnails`):** Core API for image editing via fal.ai `nano-banana` with multi-image input.
- **Content Pipeline (`auto-content-pipeline.ts`):** Bulk generation coordinator handling text/image assembly, prompting, and dispatch.
- **Monitoring & Logging:** Tracks generation success, costs, and quality metrics for optimization.
- **Admin UI (Work In Progress):** For review, approval, scheduling, and manual content management.

---

## Current Status & Completed Features

- Fully functional multi-agent content creation pipeline.
- Multi-image support in thumbnails API for improved edits.
- Central prompt system managing brand & seasonal templates.
- Basic approval interface with draft status tracking.
- Authentication and logging successfully integrated.
- Initial integrations with Cloudinary & fal.ai agent models.

---

## Roadmap & Future Development

- **Approval & Scheduling:** Implement post approval workflows and social media scheduling UIs.
- **Social Media Connectivity:** OAuth-based linking and auto-posting to Facebook, Instagram, LinkedIn.
- **WhatsApp Messaging:** Compliant bulk messaging via WhatsApp Business API.
- **Enhanced Content Validation:** Incorporate plagiarism detection, fact checking, and image-based scene understanding.
- **Analytics & A/B Testing:** Develop dashboards to measure content performance and guide tuning.
- **Expanded Agent Roles:** Introduce auto-suggestion, reactive agents for trending content, and sharper campaigning.

---

## Development & Deployment Best Practices

- Use consistent environment variables for secrets (e.g., FAL_API_KEY, TOKEN).
- Maintain strict API route authentication and Vercel bypass security.
- Monitor rate limits; batch requests smartly.
- Adopt modular agent patterns for easier feature additions.
- Store all generated content with metadata for audit and reuse.
- Regularly iterate prompts and evaluation metrics for continuous improvement.

---

## Notes

- Prompt evolution is key: updating the central prompt generator cascades improvements across all content.
- Leverage fal.ai's multimodal capabilities for future image analysis and editing.
- Schedule social posting and messaging cautiously respecting platform policies.
- Archive documentation in markdown format in the repo for clarity and onboarding.
  
---

*Document last updated: 23 September 2025*

---

**For updates, contact the CarStreets dev team or AI assistant coordinator.**

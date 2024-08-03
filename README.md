<p align="center">
  <img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/ec559a9f6bfd399b82bb44393651661b08aaf7ba/icons/folder-markdown-open.svg" width="100" alt="project-logo">
</p>
<p align="center">
    <h1 align="center">SITEGEN</h1>
</p>
<p align="center">
    <em>Effortless Websites from Your Social Media Content</em>
</p>
<p align="center">
	<img src="https://img.shields.io/github/license/seanlnge/sitegen?style=default&logo=opensourceinitiative&logoColor=white&color=0080ff" alt="license">
	<img src="https://img.shields.io/github/last-commit/seanlnge/sitegen?style=default&logo=git&logoColor=white&color=0080ff" alt="last-commit">
	<img src="https://img.shields.io/github/languages/top/seanlnge/sitegen?style=default&color=0080ff" alt="repo-top-language">
	<img src="https://img.shields.io/github/languages/count/seanlnge/sitegen?style=default&color=0080ff" alt="repo-language-count">
<p>
<p align="center">
	<!-- default option, no dependency badges. -->
</p>

<br><!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary><br>

- [ Overview](#-overview)
- [ Features](#-features)
- [ Repository Structure](#-repository-structure)
- [ Modules](#-modules)
- [ Getting Started](#-getting-started)
  - [ Installation](#-installation)
  - [ Usage](#-usage)
  - [ Tests](#-tests)
- [ Project Roadmap](#-project-roadmap)
- [ Contributing](#-contributing)
- [ License](#-license)
- [ Acknowledgments](#-acknowledgments)
</details>
<hr>

##  Overview

SiteGEN is a dynamic application designed to automate the creation of customized static websites using user-provided social media data and a diverse range of HTML templates. By scrapping social media profiles and processing the collected data, SiteGEN personalizes web pages with tailored content, images, and layout options. The platform integrates OpenAI to facilitate interactive design iterations, ensuring an efficient and user-friendly web development experience. Ideal for users seeking to streamline website generation with consistent and visually appealing results, SiteGEN supports extensive customization and effortless content updates through its robust template and scraper modules.

---

##  Features

|    | Feature         | Description                                                                                   |
|----|-----------------|-----------------------------------------------------------------------------------------------|
| ⚙️  | **Architecture**  | Predominantly a TypeScript-based project with a modular structure, leveraging files for orchestrating tasks, template handling, and utilities.|
| 🔩 | **Code Quality**  | The code adheres to TypeScript strict type-checking, ensuring robust and error-resistant code. Uses clear function names and modular file organization.|
| 📄 | **Documentation** | Minimal documentation present in code comments. More detailed documentation needed for end-user comprehension and developer onboarding.|
| 🔌 | **Integrations**  | Integrates with OpenAI for message handling, utilizes Puppeteer for web scraping, and Sharp for image processing.|
| 🧩 | **Modularity**    | High modularity with distinct files for specific functionalities like scraping, message handling, templates, and utilities. Promotes reusability.|
| 🧪 | **Testing**       | No explicit information on testing frameworks or tools. Emphasis on manual testing likely due to interactive nature of the project.|
| ⚡️  | **Performance**   | Efficiency and resource usage largely dependent on Puppeteer and Sharp. Performance can vary based on task complexity and data volume.|
| 🛡️ | **Security**      | Uses `dotenv` for environment variables, securing sensitive information. No mention of other specific security measures.|
| 📦 | **Dependencies**  | Key dependencies include `dotenv`, `typescript`, `openai`, `axios`, `puppeteer`, `sharp`, and `prompt-sync`.|
| 🚀 | **Scalability**   | Scalable for handling multiple templates and social media scraping tasks. Scalability may be limited by the performance of integrated tools.|

---

##  Repository Structure

```sh
└── sitegen/
    ├── dist
    │   ├── index.js
    │   └── src
    ├── index.ts
    ├── package.json
    ├── README.md
    ├── src
    │   ├── index.ts
    │   ├── messagechain.ts
    │   ├── scraper.ts
    │   ├── template.ts
    │   └── utils.ts
    ├── templates
    │   ├── big-picture
    │   ├── dimension
    │   ├── directive
    │   ├── global
    │   ├── spectral
    │   ├── strata
    │   └── TEMPLATE_REFINING.md
    └── tsconfig.json
```

---

##  Modules

<details closed><summary>.</summary>

| File                                                                           | Summary                                                                                                                                                                                                                                                                                                                                                               |
| ---                                                                            | ---                                                                                                                                                                                                                                                                                                                                                                   |
| [index.ts](https://github.com/seanlnge/sitegen/blob/master/index.ts)           | Facilitates the interactive setup and execution of the SiteGEN application, guiding users through input collection for social media handles, advanced settings, and template selection. Initiates the build process, manages error handling, and supports iterative website revisions, ensuring a streamlined user experience and efficient site generation workflow. |
| [package.json](https://github.com/seanlnge/sitegen/blob/master/package.json)   | Define essential project metadata, dependencies, and development scripts, facilitating project setup, dependency management, and development workflows for generating websites from Instagram templates.                                                                                                                                                              |
| [tsconfig.json](https://github.com/seanlnge/sitegen/blob/master/tsconfig.json) | Configure TypeScript compiler options to ensure compatibility with ES2016, enable CommonJS module generation, specify the output directory, and enforce strict type-checking rules. Facilitate importing CommonJS modules and maintain consistent casing in filenames while skipping library type checks for efficiency.                                              |

</details>

<details closed><summary>src</summary>

| File                                                                                   | Summary                                                                                                                                                                                                                                                                                                                                                                  |
| ---                                                                                    | ---                                                                                                                                                                                                                                                                                                                                                                      |
| [index.ts](https://github.com/seanlnge/sitegen/blob/master/src\index.ts)               | Orchestrates the end-to-end process of building a customized website by scraping social media data, selecting and modifying templates, and placing images. Automates site revisions based on client feedback, leveraging message chains and options for streamlined, efficient web development within the SiteGEN framework.                                             |
| [messagechain.ts](https://github.com/seanlnge/sitegen/blob/master/src\messagechain.ts) | Enhances multi-step chat interactions by integrating OpenAI for generating and managing message chains, enabling user, system, and assistant message additions, querying AI models, generating and describing images, and maintaining an optional log for debugging. Seamlessly integrates with the broader site generation architecture for dynamic content generation. |
| [scraper.ts](https://github.com/seanlnge/sitegen/blob/master/src\scraper.ts)           | Scraper functionality fetches and processes social media profiles and website screenshots using Puppeteer. It supports Instagram and Facebook scrapers to extract profile data and images. Additionally, it captures and slices webpage screenshots for various viewport sizes, enhancing content aggregation within the parent repositorys site generation framework.   |
| [template.ts](https://github.com/seanlnge/sitegen/blob/master/src\template.ts)         | Template management and generation are the core functions of this code, enabling the creation of customizable HTML and CSS builds based on predefined templates. It includes dynamic entry point handling, image management, and folder structure setup, facilitating the automated construction of website components within the repositorys broader architecture.      |
| [utils.ts](https://github.com/seanlnge/sitegen/blob/master/src\utils.ts)               | Utility functions facilitate JSON and XML parsing from strings, ensuring data extraction and validation within the repository. They provide essential support for asynchronous operations with a sleep function, enhancing the overall robustness and versatility of the site generation process in the parent repositorys architecture.                                 |

</details>

<details closed><summary>templates.big-picture</summary>

| File                                                                                               | Summary                                                                                                                                                                                                                                                                                                                                                                           |
| ---                                                                                                | ---                                                                                                                                                                                                                                                                                                                                                                               |
| [index.html](https://github.com/seanlnge/sitegen/blob/master/templates\big-picture\index.html)     | Highlighting a dynamic HTML template, this file facilitates the generation of customizable web pages within the big-picture theme. It incorporates placeholder elements for site-specific content, ensuring easy personalization and consistency across the website, forming an integral part of the repository's templating system for streamlined and flexible web development. |
| [sitegen.json](https://github.com/seanlnge/sitegen/blob/master/templates\big-picture\sitegen.json) | Define the structure and default root styles for the assets and theme of the big-picture template, ensuring consistency and visual coherence within the generated site from the sitegen repository.                                                                                                                                                                               |

</details>

<details closed><summary>templates.dimension</summary>

| File                                                                                             | Summary                                                                                                                                                                                                                                                                                                                                                |
| ---                                                                                              | ---                                                                                                                                                                                                                                                                                                                                                    |
| [index.html](https://github.com/seanlnge/sitegen/blob/master/templates\dimension\index.html)     | Defines a template for creating a customizable webpage with dynamic content placeholders. Structured to include a header, multiple sections, a contact form, and a footer, enabling unique site generation through variable substitution. Essential for generating consistent and adaptable website pages within the repositorys templating framework. |
| [sitegen.json](https://github.com/seanlnge/sitegen/blob/master/templates\dimension\sitegen.json) | Defines the projects asset structure and default styling for the dimension' template, specifying key JavaScript files and an image, alongside CSS variables for consistent theming. Enhances the extensibility and uniformity of the generated static site within the repository's broader template management system.                                 |

</details>

<details closed><summary>templates.directive</summary>

| File                                                                                             | Summary                                                                                                                                                                                                                                                                                                                                                                    |
| ---                                                                                              | ---                                                                                                                                                                                                                                                                                                                                                                        |
| [index.html](https://github.com/seanlnge/sitegen/blob/master/templates\directive\index.html)     | Serves as a comprehensive HTML template for generating a customizable, responsive webpage within the site generator architecture. Incorporates key sections including headers, main content, features, footer, and script integrations. Dynamically populated placeholders enable easy content customization, ensuring a flexible and consistent site building experience. |
| [sitegen.json](https://github.com/seanlnge/sitegen/blob/master/templates\directive\sitegen.json) | Defines the assets and default styling parameters for the directive template, contributing to the visual and structural consistency within the site generation framework of the repository. Enhances the reusability and customization of the template, aligning it with the overall architecture's templating system.                                                     |

</details>

<details closed><summary>templates.spectral</summary>

| File                                                                                            | Summary                                                                                                                                                                                                                                                                                                                |
| ---                                                                                             | ---                                                                                                                                                                                                                                                                                                                    |
| [index.html](https://github.com/seanlnge/sitegen/blob/master/templates\spectral\index.html)     | Serves as a customizable HTML template for a website, allowing users to dynamically insert content such as titles, images, and text through predefined placeholders. Integrates with the broader sitegen repositorys architecture by providing a framework for creating consistent and responsive web pages with ease. |
| [sitegen.json](https://github.com/seanlnge/sitegen/blob/master/templates\spectral\sitegen.json) | Defines the structure and theming parameters for the “spectral” template in the site generation process, detailing dependencies and default CSS variables to ensure consistent styling and functionality across generated web pages.                                                                                   |

</details>

<details closed><summary>templates.strata</summary>

| File                                                                                          | Summary                                                                                                                                                                                                                                                                                                                                 |
| ---                                                                                           | ---                                                                                                                                                                                                                                                                                                                                     |
| [index.html](https://github.com/seanlnge/sitegen/blob/master/templates\strata\index.html)     | Index.html` in the `strata` template directory serves as a customizable HTML skeleton for generating user-specific webpages. It integrates dynamic placeholders for titles, images, articles, and contact information, ensuring versatility and ease of content updates in line with the parent repositorys site generation objectives. |
| [sitegen.json](https://github.com/seanlnge/sitegen/blob/master/templates\strata\sitegen.json) | Define the structural composition and default styling parameters for the Strata template, specifying the paths of critical JavaScript and image assets, while setting foundational color properties for the template's visual theme within the parent repository's static site generation framework.                                    |

</details>

<details closed><summary>templates.global.css</summary>

| File                                                                                                                    | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---                                                                                                                     | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| [fontawesome-all.min.css](https://github.com/seanlnge/sitegen/blob/master/templates\global\css\fontawesome-all.min.css) | The file `scraper.ts` within the `sitegen/src` directory is a pivotal component of the site generation (sitegen) repository. This repository is designed to automate the creation of static websites using various templates.### Main Purpose:-**Data Extraction:** The primary function of `scraper.ts` is to handle web scraping tasks. It extracts relevant data from specified web sources, which is crucial for populating the static sites generated by the system.### Critical Features:-**Content Aggregation:** This module collects data from multiple web pages, ensuring the generated sites are rich and up-to-date with dynamically sourced content.-**Integration with Templates:** The scraped data is intended to be fed into various templates available in the `templates` directory, supporting diverse site designs and layouts.-**Utility Support:** The scraper works seamlessly with other utility functions defined in `utils.ts` to ensure efficient data processing and error handling.Within the overall architecture, `scraper.ts` serves as the backbone for content gathering, making it an essential element of the site's generation process supported by the template and utility modules.---This summary provides a clear understanding of the role and functionality of the `scraper.ts` file in the context of the sitegen repository, without delving into specific code-related details. |

</details>

<details closed><summary>templates.global.js</summary>

| File                                                                                                               | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---                                                                                                                | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| [breakpoints.min.js](https://github.com/seanlnge/sitegen/blob/master/templates\global\js\breakpoints.min.js)       | Enable dynamic responsiveness by defining and managing CSS breakpoints. Integrate seamless responsiveness into web applications through event listeners for resizing, orientation changes, and fullscreen changes, providing a foundation for adaptive design within the `global` template module.                                                                                                                                                                                                                                                                                                                                                                         |
| [browser.min.js](https://github.com/seanlnge/sitegen/blob/master/templates\global\js\browser.min.js)               | Identifies the users browser and device information, enabling the application to tailor functionality and interface according to different environments and capabilities. Automatically initializes upon loading, ensuring compatibility and optimized user experience across various web browsers and operating systems.                                                                                                                                                                                                                                                                                                                                                  |
| [jquery.min.js](https://github.com/seanlnge/sitegen/blob/master/templates\global\js\jquery.min.js)                 | SummaryThe file `templates/global/js/jquery.min.js` is a minified version of the jQuery library. Within the context of the `sitegen` repository, this file provides essential utility functions and DOM manipulation capabilities to the templates located under the `templates` directory. Specifically, the jQuery library facilitates the creation of dynamic, interactive web pages by offering simplified JavaScript operations. Its inclusion in the repository is critical for enhancing the functionality and user experience of the generated web templates, making it easier to handle events, perform animations, and manage asynchronous requests efficiently. |
| [jquery.poptrox.min.js](https://github.com/seanlnge/sitegen/blob/master/templates\global\js\jquery.poptrox.min.js) | Enhances pop-up functionality for image and media galleries within the global template section, integrating smooth overlay effects, navigation, and easy-close features to improve user interactivity and aesthetic appeal. Supports various media types including images, YouTube, Vimeo, SoundCloud, and AJAX content for a versatile user experience.                                                                                                                                                                                                                                                                                                                   |

</details>

---

##  Getting Started

**System Requirements:**

* **JSON**: `version x.y.z`

###  Installation

<h4>From <code>source</code></h4>

> 1. Clone the sitegen repository:
>
> ```console
> $ git clone https://github.com/seanlnge/sitegen
> ```
>
> 2. Change to the project directory:
> ```console
> $ cd sitegen
> ```
>
> 3. Install the dependencies:
> ```console
> $ npm run setup
> ```
> 4. Run it;
> ```console
> $ npm run dev      # builds typescript and runs it
> $ npm run prod     # just runs it
> ```

###  Usage

<h4>From <code>source</code></h4>

> Run sitegen using the command below:
> ```console
> $ > INSERT-RUN-COMMANDS
> ```

###  Tests

> Run the test suite using the command below:
> ```console
> $ > INSERT-TEST-COMMANDS
> ```

---

##  Project Roadmap

- [X] `► INSERT-TASK-1`
- [ ] `► INSERT-TASK-2`
- [ ] `► ...`

---

##  Contributing

Contributions are welcome! Here are several ways you can contribute:

- **[Report Issues](https://github.com/seanlnge/sitegen/issues)**: Submit bugs found or log feature requests for the `sitegen` project.
- **[Submit Pull Requests](https://github.com/seanlnge/sitegen/blob/main/CONTRIBUTING.md)**: Review open PRs, and submit your own PRs.
- **[Join the Discussions](https://github.com/seanlnge/sitegen/discussions)**: Share your insights, provide feedback, or ask questions.

<details closed>
<summary>Contributing Guidelines</summary>

1. **Fork the Repository**: Start by forking the project repository to your github account.
2. **Clone Locally**: Clone the forked repository to your local machine using a git client.
   ```sh
   git clone https://github.com/seanlnge/sitegen
   ```
3. **Create a New Branch**: Always work on a new branch, giving it a descriptive name.
   ```sh
   git checkout -b new-feature-x
   ```
4. **Make Your Changes**: Develop and test your changes locally.
5. **Commit Your Changes**: Commit with a clear message describing your updates.
   ```sh
   git commit -m 'Implemented new feature x.'
   ```
6. **Push to github**: Push the changes to your forked repository.
   ```sh
   git push origin new-feature-x
   ```
7. **Submit a Pull Request**: Create a PR against the original project repository. Clearly describe the changes and their motivations.
8. **Review**: Once your PR is reviewed and approved, it will be merged into the main branch. Congratulations on your contribution!
</details>

<details closed>
<summary>Contributor Graph</summary>
<br>
<p align="center">
   <a href="https://github.com{/seanlnge/sitegen/}graphs/contributors">
      <img src="https://contrib.rocks/image?repo=seanlnge/sitegen">
   </a>
</p>
</details>

---

##  License

This project is protected under the [SELECT-A-LICENSE](https://choosealicense.com/licenses) License. For more details, refer to the [LICENSE](https://choosealicense.com/licenses/) file.

---

##  Acknowledgments

- List any resources, contributors, inspiration, etc. here.

[**Return**](#-overview)

---

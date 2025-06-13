# GRAPHQL

A web application that displays your Zone01 student profile by fetching data from the school's GraphQL API.

## Overview

This project creates a personalized profile page that visualizes your progress and achievements at Zone01 Kisumu. It leverages the school's GraphQL API to fetch and display your data in an interactive and visually appealing way.

## Features

- **Authentication System**

  - Login with username or email
  - JWT-based authentication
  - Logout functionality
  - Error handling for invalid credentials

- **Profile Information**

  - Basic user identification
  - XP amount tracking
  - Project grades display
  - Audit statistics
  - Skills progression

- **Interactive Statistics**
  - SVG-based data visualization with animations
  - Multiple graph types to track your progress:
    - XP progression over time (line chart)
    - Project success rate by language (bar chart)
    - Audit ratio visualization (pie chart)
    - Skills overview (radar chart)
  - Interactive chart navigation and filtering
  - Hover effects and tooltips for better user experience
  - Responsive design for all screen sizes

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Authentication: JWT (JSON Web Tokens)
- Data Fetching: GraphQL API
- Data Visualization: SVG for custom graphs
- Hosting: Github-Pages

## API Endpoints

- GraphQL API: `https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql`
- Authentication: `https://learn.zone01kisumu.ke/api/auth/signin`

## Getting Started

### Prerequisites

- Modern web browser
- Basic understanding of GraphQL queries

### Installation

1. Clone the repository

   ```
   git clone https://learn.zone01kisumu.ke/git/moonyango/graphql
   ```

2. Navigate to the project directory

   ```
   cd graphql
   ```

3. Open with live-server extension

### Usage

1. Visit the login page
2. Enter your Zone01 credentials (username/email and password)
3. Explore your personalized profile dashboard with:
   - Overview of completed projects by language
   - XP progression tracking
   - Interactive statistical charts
   - Skills assessment radar
   - Audit ratio visualization
4. Use chart navigation to filter specific statistics
5. Log out when finished

### Chart Features

- **XP Progression Chart**: Track your experience points over time with an animated line graph
- **Project Success Chart**: Compare completion rates across Go, JavaScript, and Rust projects
- **Audit Ratio Chart**: Visualize your audit success rate with an interactive pie chart
- **Skills Radar Chart**: See your top skills displayed in a radar/spider chart format
- **Interactive Navigation**: Filter charts by category (Projects, Audits, Skills, or All)

## Deployment

This project is hosted on github-pages and can be accessed at [\[graphql\]](https://moseeh.github.io/graphql/).

## Learning Objectives

- GraphQL query language and API interaction
- JWT authentication implementation
- SVG-based data visualization
- User interface and experience design
- Frontend web development best practices

## Acknowledgments

- Zone01 Kisumu for providing the GraphQL API

# Netflix Data Analysis Dashboard

## Project Overview

This project analyzes the Netflix Movies and TV Shows dataset from Kaggle to uncover trends in content distribution, production patterns, genre popularity, and platform growth over time.

Using Python for data cleaning and exploratory data analysis (EDA), the project generates visual insights and presents them through an interactive dashboard.

## Objectives

* Clean and preprocess Netflix content data.
* Explore trends in movies and TV shows.
* Analyze content additions over time.
* Identify top producing countries.
* Examine genre distribution and rating classifications.
* Visualize key insights through charts and an interactive dashboard.

## Dataset

**Source:** Netflix Movies and TV Shows Dataset (Kaggle)

The dataset contains information about Netflix titles, including:

* Title
* Type (Movie/TV Show)
* Country
* Genre
* Rating
* Release Year
* Date Added
* Duration

## Technologies Used

* Python
* Pandas
* NumPy
* Matplotlib
* Seaborn
* HTML
* CSS
* JavaScript

## Data Processing

The dataset was cleaned and preprocessed using Pandas by:

* Handling missing values
* Formatting date fields
* Standardizing categorical information
* Preparing data for visualization and analysis

## Visualizations

The project includes visualizations for:

* Content Distribution (Movies vs TV Shows)
* Content Added Per Year
* Top Producing Countries
* Genre Distribution
* Rating Classifications
* TV Show Season Analysis

## Key Insights

* Netflix hosts more Movies than TV Shows in its catalog.
* Content additions increased significantly after 2015, reflecting rapid platform expansion.
* The United States contributes the largest share of Netflix content.
* Drama and International Movies are among the most common genres.
* TV-MA and TV-14 are the most frequent content ratings.
* Movies dominate the platform, while TV Shows typically span multiple seasons.
* Netflix has steadily expanded its international content library over time.
* Recent release years account for a large portion of the catalog, indicating a focus on modern content.

## Project Structure

```text
netflix-data-analysis/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── output/
│   └── visualizations/
│
├── src/
│   ├── analyze.py
│   ├── app.js
│   ├── index.html
│   └── style.css
│
├── run.py
├── requirements.txt
└── README.md
```

## How to Run

1. Clone the repository

```bash
git clone https://github.com/stutisinghh28/netflix-data-analysis.git
```

2. Install dependencies

```bash
pip install -r requirements.txt
```

3. Run the project

```bash
uv run run.py
```

4. Open the dashboard

```text
http://localhost:8000/src/index.html
```

## Skills Demonstrated

* Data Cleaning
* Exploratory Data Analysis (EDA)
* Data Visualization
* Statistical Insight Generation
* Dashboard Development
* Python Programming
* Data Storytelling

## Author

Stuti Singh
B.Tech Computer Science Engineering (CSE)
VIT Chennai

import os
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import requests

# Set paths (relative to netflix-data-analysis project root)
SRC_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SRC_DIR)
DATA_RAW_DIR = os.path.join(PROJECT_ROOT, 'data', 'raw')
DATA_PROCESSED_DIR = os.path.join(PROJECT_ROOT, 'data', 'processed')
OUTPUT_VIS_DIR = os.path.join(PROJECT_ROOT, 'output', 'visualizations')

# Create directories if they don't exist
os.makedirs(DATA_RAW_DIR, exist_ok=True)
os.makedirs(DATA_PROCESSED_DIR, exist_ok=True)
os.makedirs(OUTPUT_VIS_DIR, exist_ok=True)

CSV_PATH = os.path.join(DATA_RAW_DIR, 'netflix_titles.csv')
URL = "https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2021/2021-04-20/netflix_titles.csv"

# Step 1: Download dataset if it doesn't exist
if not os.path.exists(CSV_PATH):
    print("Downloading Netflix dataset...")
    try:
        response = requests.get(URL, timeout=30)
        response.raise_for_status()
        with open(CSV_PATH, 'wb') as f:
            f.write(response.content)
        print("Download complete and saved to data/raw/netflix_titles.csv.")
    except Exception as e:
        print(f"Error downloading dataset: {e}")
        raise e

# Step 2: Load and Clean Dataset
print("Loading and cleaning dataset...")
df = pd.read_csv(CSV_PATH)

# Handle missing values
df['director'] = df['director'].fillna('Not Specified')
df['cast'] = df['cast'].fillna('Not Specified')
df['country'] = df['country'].fillna('Unknown')

# Clean dates and handle exceptions
df['date_added'] = df['date_added'].str.strip()
df['date_added_dt'] = pd.to_datetime(df['date_added'], format='%B %d, %Y', errors='coerce')

# Extract year and month added
df['year_added'] = df['date_added_dt'].dt.year.astype('Int64')
df['month_added'] = df['date_added_dt'].dt.strftime('%B')

# Fill missing ratings and durations if any
df['rating'] = df['rating'].fillna('Unrated')

# Fix duration issues (some Kaggle dataset entries had rating and duration swapped)
# For example, if rating starts with numbers like "74 min" or "3 Seasons"
swapped_mask = df['rating'].str.contains('min|Season', na=False)
if swapped_mask.any():
    print(f"Fixing {swapped_mask.sum()} swapped rating/duration records...")
    df.loc[swapped_mask, 'duration'] = df.loc[swapped_mask, 'rating']
    df.loc[swapped_mask, 'rating'] = 'Unrated'

df['duration'] = df['duration'].fillna('Unknown')

# Add duration number and unit for easier sorting/filtering
def extract_duration_value(row):
    try:
        val = str(row['duration']).split()[0]
        return int(val)
    except:
        return 0

df['duration_value'] = df.apply(extract_duration_value, axis=1)
df['duration_unit'] = df['duration'].apply(lambda x: str(x).split()[1] if len(str(x).split()) > 1 else 'Unknown')

# Step 3: Configure Beautiful Dark Theme Visualizations
print("Configuring visualization style...")
plt.style.use('dark_background')
plt.rcParams['figure.facecolor'] = '#141414'
plt.rcParams['axes.facecolor'] = '#141414'
plt.rcParams['savefig.facecolor'] = '#141414'
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['Arial', 'Helvetica', 'DejaVu Sans']
plt.rcParams['axes.edgecolor'] = '#2c2c2c'
plt.rcParams['axes.linewidth'] = 0.8
plt.rcParams['grid.color'] = '#2c2c2c'
plt.rcParams['grid.linestyle'] = '--'
plt.rcParams['grid.linewidth'] = 0.5
plt.rcParams['xtick.color'] = '#aaaaaa'
plt.rcParams['ytick.color'] = '#aaaaaa'
plt.rcParams['axes.labelcolor'] = '#e5e5e5'

NETFLIX_RED = '#E50914'
NETFLIX_DARK_RED = '#B81D24'
ACCENT_GRAY = '#E5E5E5'
MUTED_GRAY = '#808080'
DARK_CARD = '#1F1F1F'
RED_PALETTE = ['#E50914', '#F5F5F1', '#B3B3B3', '#564d4d', '#8c2520']

# Utility function to style spines
def clean_chart(ax):
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#2c2c2c')
    ax.spines['bottom'].set_color('#2c2c2c')
    ax.yaxis.grid(True, zorder=0)
    ax.xaxis.grid(False)

# 1. Content Distribution: Movies vs TV Shows
print("Generating visualization 1: Content Distribution...")
plt.figure(figsize=(7, 6))
type_counts = df['type'].value_counts()
colors = [NETFLIX_RED, '#333333']
wedges, texts, autotexts = plt.pie(
    type_counts, 
    labels=type_counts.index, 
    autopct='%1.1f%%', 
    startangle=90, 
    colors=colors,
    wedgeprops={'edgecolor': '#141414', 'linewidth': 2, 'antialiased': True},
    pctdistance=0.75
)
# Make it a donut chart
centre_circle = plt.Circle((0,0), 0.55, fc='#141414')
plt.gca().add_artist(centre_circle)

# Style texts
for text in texts:
    text.set_color('#ffffff')
    text.set_fontsize(12)
    text.set_weight('bold')
for autotext in autotexts:
    autotext.set_color('#ffffff')
    autotext.set_fontsize(11)
    autotext.set_weight('bold')

plt.title('Netflix Catalog Distribution: Movies vs TV Shows', color='#ffffff', fontsize=14, pad=20, weight='bold')
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_VIS_DIR, 'content_distribution.png'), dpi=150, facecolor='#141414')
plt.close()


# 2. Content Added Per Year (2008-2021)
print("Generating visualization 2: Content Added Per Year...")
plt.figure(figsize=(11, 6))
# Filter out null years and restrict to standard range
yearly_added = df.dropna(subset=['year_added'])
yearly_added = yearly_added[yearly_added['year_added'] <= 2021] # Dataset ends in 2021
yearly_counts = yearly_added.groupby(['year_added', 'type']).size().unstack(fill_value=0)

# Line plot with markers
plt.plot(yearly_counts.index, yearly_counts['Movie'], marker='o', color=NETFLIX_RED, linewidth=2.5, label='Movies')
plt.plot(yearly_counts.index, yearly_counts['TV Show'], marker='s', color='#808080', linewidth=2.5, label='TV Shows')
plt.fill_between(yearly_counts.index, yearly_counts['Movie'], color=NETFLIX_RED, alpha=0.1)
plt.fill_between(yearly_counts.index, yearly_counts['TV Show'], color='#808080', alpha=0.1)

ax = plt.gca()
clean_chart(ax)
plt.title('Content Added Per Year on Netflix', color='#ffffff', fontsize=15, pad=20, weight='bold')
plt.xlabel('Year Added', fontsize=11, labelpad=10)
plt.ylabel('Count of Titles Added', fontsize=11, labelpad=10)
plt.xticks(yearly_counts.index, rotation=45)
plt.legend(facecolor='#1c1c1c', edgecolor='#333333', loc='upper left')
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_VIS_DIR, 'content_added_per_year.png'), dpi=150, facecolor='#141414')
plt.close()


# 3. Top Producing Countries
print("Generating visualization 3: Top Producing Countries...")
# Explode the countries because some records list multiple (e.g. "United States, India")
country_s = df['country'].str.split(', ').explode()
country_s = country_s[country_s != 'Unknown']
top_countries = country_s.value_counts().head(10)

plt.figure(figsize=(10, 6))
sns.barplot(x=top_countries.values, y=top_countries.index, palette='Reds_r')
ax = plt.gca()
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_color('#2c2c2c')
ax.spines['bottom'].set_color('#2c2c2c')
ax.xaxis.grid(True, zorder=0, color='#2c2c2c', linestyle='--', linewidth=0.5)
ax.yaxis.grid(False)

plt.title('Top 10 Content Producing Countries on Netflix', color='#ffffff', fontsize=15, pad=20, weight='bold')
plt.xlabel('Number of Titles (Includes Co-productions)', fontsize=11, labelpad=10)
plt.ylabel('Country', fontsize=11, labelpad=10)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_VIS_DIR, 'top_countries.png'), dpi=150, facecolor='#141414')
plt.close()


# 4. Genre Distribution (Top 10 Genres)
print("Generating visualization 4: Genre Distribution...")
genre_s = df['listed_in'].str.split(', ').explode()
top_genres = genre_s.value_counts().head(10)

plt.figure(figsize=(10, 6))
sns.barplot(x=top_genres.values, y=top_genres.index, color=NETFLIX_RED, zorder=3)
ax = plt.gca()
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_color('#2c2c2c')
ax.spines['bottom'].set_color('#2c2c2c')
ax.xaxis.grid(True, zorder=0, color='#2c2c2c', linestyle='--', linewidth=0.5)
ax.yaxis.grid(False)

# Highlight Drama and International Movies as noted in insights
for i, label in enumerate(top_genres.index):
    if label in ['Dramas', 'International Movies']:
        ax.get_children()[i].set_facecolor('#B81D24')

plt.title('Top 10 Genres in Netflix Catalog', color='#ffffff', fontsize=15, pad=20, weight='bold')
plt.xlabel('Number of Titles', fontsize=11, labelpad=10)
plt.ylabel('Genre', fontsize=11, labelpad=10)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_VIS_DIR, 'top_genres.png'), dpi=150, facecolor='#141414')
plt.close()


# 5. Rating Classifications
print("Generating visualization 5: Rating Classifications...")
plt.figure(figsize=(10, 6))
ratings_order = df['rating'].value_counts().head(10).index
sns.countplot(data=df, x='rating', order=ratings_order, palette='Reds_r', zorder=3)
ax = plt.gca()
clean_chart(ax)
plt.title('Netflix Content Rating Classifications (Top 10)', color='#ffffff', fontsize=15, pad=20, weight='bold')
plt.xlabel('Rating', fontsize=11, labelpad=10)
plt.ylabel('Count of Titles', fontsize=11, labelpad=10)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_VIS_DIR, 'rating_classifications.png'), dpi=150, facecolor='#141414')
plt.close()


# 6. TV Show Seasons Distribution
print("Generating visualization 6: TV Show Duration (Seasons)...")
tv_shows = df[df['type'] == 'TV Show']
# Standardize season counts
tv_seasons = tv_shows['duration'].value_counts().head(8)

plt.figure(figsize=(9, 6))
sns.barplot(x=tv_seasons.index, y=tv_seasons.values, color=NETFLIX_RED, zorder=3)
ax = plt.gca()
clean_chart(ax)
plt.title('Distribution of TV Show Seasons', color='#ffffff', fontsize=15, pad=20, weight='bold')
plt.xlabel('Duration (Number of Seasons)', fontsize=11, labelpad=10)
plt.ylabel('Count of TV Shows', fontsize=11, labelpad=10)
plt.xticks(rotation=15)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_VIS_DIR, 'tv_shows_seasons.png'), dpi=150, facecolor='#141414')
plt.close()


# Step 4: Export Summary Metrics and Cleaned Data for Web Dashboard
print("Exporting processed data and summary metrics for the interactive dashboard...")

# 1. Cleaned Data Export (Exclude datetime objects for JSON/JS compatibility, keep only useful fields to save size)
columns_to_keep = ['show_id', 'type', 'title', 'director', 'cast', 'country', 'date_added', 'release_year', 'rating', 'duration', 'listed_in', 'description']
df_subset = df[columns_to_keep].copy()

# Sort by release_year descending then title
df_subset = df_subset.sort_values(by=['release_year', 'title'], ascending=[False, True])

# Export CSV for loading in Javascript
df_subset.to_csv(os.path.join(DATA_PROCESSED_DIR, 'netflix_titles_cleaned.csv'), index=False)

# 2. Summary statistics JSON
summary_stats = {
    "total_titles": int(len(df)),
    "total_movies": int((df['type'] == 'Movie').sum()),
    "total_tv_shows": int((df['type'] == 'TV Show').sum()),
    "movie_percentage": float(round((df['type'] == 'Movie').sum() / len(df) * 100, 1)),
    "tv_percentage": float(round((df['type'] == 'TV Show').sum() / len(df) * 100, 1)),
    "top_country": str(top_countries.index[0]),
    "top_country_count": int(top_countries.values[0]),
    "top_genre": str(top_genres.index[0]),
    "top_genre_count": int(top_genres.values[0]),
    "latest_update_year": int(df['year_added'].max()) if pd.notnull(df['year_added'].max()) else 2021,
    "top_ratings": [{"rating": str(k), "count": int(v)} for k, v in df['rating'].value_counts().head(5).items()]
}

with open(os.path.join(DATA_PROCESSED_DIR, 'summary_metrics.json'), 'w') as f:
    json.dump(summary_stats, f, indent=4)

print("Analysis and data export completed successfully!")

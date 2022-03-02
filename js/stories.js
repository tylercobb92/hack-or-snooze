"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showTrashCan = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
        ${showTrashCan ? getTrashCan() : ""}
        ${showStar ? getStar(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}


// add star for favorite/unfavorite story
function getStar(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `
      <span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>`;
}

// add trash can icon for delete story button
function getTrashCan() {
  return `
  <span class="trash-can">
    <i class="fas fa-trash-alt"></i>
  </span>`;
}


/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

// submit story from submit story form
async function submitNewStory(e) {
  e.preventDefault();

  const title = $("#story-title").val();
  const url = $("#story-url").val();
  const author = $("#story-author").val();
  const username = currentUser.username;
  const storyData = { title, url, author, username };

  const story = await storyList.addStory(currentUser, storyData);

  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  $submitForm.hide()
  $submitForm.trigger("reset")
}

$submitForm.on('submit', submitNewStory);

async function toggleFavorite(e) {
  const $target = $(e.target);
  const $closestLi = $target.closest('li');
  const storyId = $closestLi.attr('id');
  const story = storyList.stories.find(s => s.storyId === storyId);

  if ($target.hasClass("fas")) {
    await currentUser.removeFavorite(story);
    $target.closest('i').toggleClass("fas far");
  } else {
    await currentUser.addFavorite(story);
    $target.closest("i").toggleClass("fas far")
  }
}

$storiesLists.on('click', '.star', toggleFavorite);

function showFavoritesList() {
  $favoritedStories.empty();

  if (currentUser.favorites.length === 0) {
    $favoritedStories.append("<h5>No stories have been favorited!</h5>");
  } else {
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }

  $favoritedStories.show();
}

function putUserStoriesOnPage() {
  $ownStories.empty();

  if (currentUser.ownStories.length === 0) {
    $ownStories.append("<h5>You haven't added any stories yet!</h5>")
  } else {
    for (let story of currentUser.ownStories) {
      let $story = generateStoryMarkup(story, true);
      $ownStories.append($story);
    }
  }

  $ownStories.show();
}

async function deleteStory(e) {
  const $closestLi = $(e.target).closest('li');
  const storyId = $closestLi.attr('id');

  await storyList.removeStory(currentUser, storyId);

  await showOwnStories();
}

$ownStories.on('click', ".trash-can", deleteStory);
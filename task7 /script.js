const API_URL = 'https://jsonplaceholder.typicode.com/posts';
const PAGE_SIZE = 10; 

class PostsModel {
  constructor() {
    this.posts = [];       
    this.searchQuery = ''; 
    this.loadedCount = 0;  
    this.hasMore = true;  
    this.isLoading = false;
  }

  setQuery(query) {
    this.searchQuery = query;
  }

  hasQuery() {
    return this.searchQuery.trim() !== '';
  }

  async loadPage() {
    if (!this.hasMore || this.isLoading) return;

    this.isLoading = true;
    try {
      const response = await fetch(`${API_URL}?_start=${this.loadedCount}&_limit=${PAGE_SIZE}`);

      if (!response.ok) {
        throw new Error(`сервер ответил ошибкой ${response.status}`);
      }

      const page = await response.json();
      this.posts = [...this.posts, ...page];
      this.loadedCount += page.length;

      if (page.length < PAGE_SIZE) {
        this.hasMore = false;
      }
    } catch (error) {
      const reason = error.message === 'Failed to fetch'
        ? 'нет соединения с сервером'
        : error.message;
      throw new Error(`Не удалось загрузить посты: ${reason}`);
    } finally {
      this.isLoading = false;
    }
  }

  getVisiblePosts() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return this.posts;
    }
    return this.posts.filter((post) => post.title.toLowerCase().includes(query));
  }
}

class PostsView {
  constructor() {
    this.postsContainer = document.querySelector('#posts');
    this.searchInput = document.querySelector('#search-input');
    this.loader = document.querySelector('#loader');
    this.endMessage = document.querySelector('#end-message');
    this.notFoundMessage = document.querySelector('#not-found');
    this.errorBox = document.querySelector('#error-box');
    this.errorText = document.querySelector('#error-text');
    this.retryButton = document.querySelector('#retry-btn');
  }

  renderPosts(posts) {
    this.postsContainer.innerHTML = '';
    posts.forEach((post) => this.postsContainer.append(this.createPostCard(post)));
  }

  createPostCard(post) {
    const card = document.createElement('article');
    card.className = 'post-card';

    const title = document.createElement('h2');
    title.className = 'post-title';
    title.textContent = post.title;

    const body = document.createElement('p');
    body.className = 'post-body';
    body.textContent = post.body;

    const author = document.createElement('span');
    author.className = 'post-author';
    author.textContent = `ID автора: ${post.userId}`;

    card.append(title, body, author);
    return card;
  }

  showLoader() {
    this.loader.classList.remove('hidden');
  }

  hideLoader() {
    this.loader.classList.add('hidden');
  }

  toggleEndMessage(visible) {
    this.endMessage.classList.toggle('hidden', !visible);
  }

  toggleNotFound(visible) {
    this.notFoundMessage.classList.toggle('hidden', !visible);
  }

  showError(message) {
    this.errorText.textContent = message;
    this.errorBox.classList.remove('hidden');
  }

  hideError() {
    this.errorBox.classList.add('hidden');
  }

  getSearchValue() {
    return this.searchInput.value;
  }

  isNearBottom(thresholdPx) {
    const scrolledTo = window.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;
    return scrolledTo >= pageHeight - thresholdPx;
  }

  isPageScrollable() {
    return document.documentElement.scrollHeight > window.innerHeight;
  }
}

const SEARCH_DEBOUNCE_MS = 300;  
const SCROLL_THRESHOLD_PX = 200; 

class PostsController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.searchTimer = null; 
  }

  init() {
    this.view.searchInput.addEventListener('input', () => this.onSearchInput());
    this.view.retryButton.addEventListener('click', () => this.loadMorePosts());
    window.addEventListener('scroll', () => this.onScroll());

    this.loadMorePosts(); 
  }

  onSearchInput() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.model.setQuery(this.view.getSearchValue());
      this.renderVisiblePosts();
    }, SEARCH_DEBOUNCE_MS);
  }

  onScroll() {
    if (this.view.isNearBottom(SCROLL_THRESHOLD_PX)) {
      this.loadMorePosts();
    }
  }

  async loadMorePosts() {
    if (this.model.isLoading || !this.model.hasMore) return;

    this.view.hideError();
    this.view.showLoader();

    try {
      await this.model.loadPage();
      this.renderVisiblePosts();

      if (this.model.hasMore && !this.view.isPageScrollable()) {
        await this.loadMorePosts();
      }
    } catch (error) {
      this.view.showError(error.message);
    } finally {
      this.view.hideLoader();
    }
  }

  renderVisiblePosts() {
    const visiblePosts = this.model.getVisiblePosts();
    this.view.renderPosts(visiblePosts);
    this.view.toggleNotFound(visiblePosts.length === 0 && this.model.hasQuery());
    this.view.toggleEndMessage(!this.model.hasMore && !this.model.hasQuery());
  }
}

const model = new PostsModel();
const view = new PostsView();
const controller = new PostsController(model, view);

controller.init();

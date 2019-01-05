/**
 * uses functionality defined in site_functions.js
 *
 *
 * we rely on code at https://crockford.com/javascript/private.html
 * for object encapsulation
 * TODO - verify these encapsulation techniques actually work
 */
function ContentHandler(){

  const post_content = 'post_content';
  const post_change_time = 'post_change_time';
  const max_posts = 10000;
  const max_posts_display = 5;

  let gitHubBroker = new GitHubBroker();

  //save posts to reduce number of times we access index.json
  //TODO - think about whether or not this is necessary
  let postObjArr = [];

  //for reference to message area for message update timeout function
  let m_msgArea;

  let m_oauthToken;
  ContentHandler.prototype.getOauthToken = () =>{
    return m_oauthToken;
  };
  ContentHandler.prototype.setOauthToken = (oauthToken) =>{
     m_oauthToken = oauthToken;
  };
  /**
   * fetches post using OAUTH token for authentication
   *
   * @param tokenText: DOM text input element, mean to hold an OAUTH token
   */
  ContentHandler.prototype.fetchPosts =
    async (blogPostsDiv, postPagesListContainer, start_index=0) => {
    let dbg_tag = 'ContentHandler::fetchPosts:';
    postObjArr = await gitHubBroker.get_posts_from_file(m_oauthToken);
    console.debug(dbg_tag, ' postObjArr ', postObjArr);
    postObjArr.sort( (a,b) => {
      keyA = a.post_change_time;
      keyB = b.post_change_time;
      if (keyA == undefined){
        return 1;
      }
      if (keyB == undefined ){
        return -1;
      }
      if (keyA < keyB) return 1;
      if (keyA > keyB) return -1;
      return 0;
      });
    while(blogPostsDiv.firstChild){
      blogPostsDiv.removeChild(blogPostsDiv.firstChild);
    }
    for (i=0; ((i+start_index) < postObjArr.length && i < max_posts_display); i++){
      console.debug(dbg_tag, ' postObjArr ' + (i + start_index) + ": ",
        postObjArr[i+start_index]);
      let postDiv = document.createElement('div');
      let postDate = new Date(1970,0,1);
      postDate.setTime(postObjArr[i+start_index][post_change_time]);
      postDiv.innerHTML = '<p>' + postDate + '</p>';
      postDiv.innerHTML += postObjArr[i+start_index][post_content];
      postDiv.setAttribute('class', 'blogpost');
      blogPostsDiv.appendChild(postDiv);
    }
    renderPaginationList(blogPostsDiv, postPagesListContainer,
      postObjArr.length, start_index);
  };
/**
 * renders a list of links to posts beneath the
 * blog posts
 *
 * @param blogPostsDiv: reference to div holding blog posts
 * @param postPagesDiv: reference to div holding list of
 * page links
 * @param postObjArr_length: total number of blog posts
 * @param start_index: current starting post index number
 */
renderPaginationList = (blogPostsDiv, postPagesListContainer, postObjArr_length,
  start_index) => {
  let dbg_tag = "ContentHandler::renderPaginationList:";

  while(postPagesListContainer.firstChild){
    postPagesListContainer.removeChild(postPagesListContainer.firstChild);
  }

  let postPagesLabel = document.createElement('div');
  postPagesLabel.setAttribute('class', 'PostPages');
  postPagesLabel.innerText='More Postings';
  blogPostsDiv.appendChild(postPagesLabel);

  let postPagesListDiv = document.createElement('div');
  postPagesListDiv.setAttribute('class', 'PostPages');

  let prevLink = createPostPagesLink("<<");
  if (start_index >= max_posts_display){
    prevLink.onclick = () => {
      this.fetchPosts(blogPostsDiv, postPagesListContainer,
      start_index - max_posts_display);
    };
  } else {
    //disable link
    prevLink.href = "javascript: void(0)";
  }
  postPagesListDiv.appendChild(prevLink);

  let count = 0;
  for (i=0;
    (count < max_posts_display)
      && (start_index + count < postObjArr_length);
    i = i + max_posts_display){
    let linkText = start_index  + count + 1;
    let numberLink = createPostPagesLink(linkText);
    numberLink.addEventListener("click", () => {
      //we need to save this reference to the
      //offset otherwise FireFox, at least
      //will use final value of count here
      let fn_startidx=start_index+count;
      this.fetchPosts(blogPostsDiv, postPagesListContainer, fn_startidx);
    });
    postPagesListDiv.appendChild(numberLink);
    count++;
  }

  let nextLink = createPostPagesLink(">>");
  if (start_index + max_posts_display < postObjArr_length){
    nextLink.onclick = () => {
      this.fetchPosts(blogPostsDiv, postPagesListContainer,
         start_index + max_posts_display);
       };
  } else {
    nextLink.href = "javascript: void(0)";
  }
  postPagesListDiv.appendChild(nextLink);
  postPagesListContainer.appendChild(postPagesListDiv);
  blogPostsDiv.appendChild(postPagesListDiv);
};

/**
 * cretes a link that goes in the more postings links
 * at the bottom of the page, after the posts, above the
 * footer.  Applies the PostPages style to the link
 *
 * @param linkText: text that the link should display
 */
createPostPagesLink = (linkText) =>{
  let postPageListLink = document.createElement('a');
  postPageListLink.setAttribute('class', 'PostPages');
  postPageListLink.innerText=linkText;
  postPageListLink.setAttribute('class', 'PostPages');
  return postPageListLink;
};

 ContentHandler.prototype.createOrUpdatePost =
   async (post_text, oauthToken, msgAreaDiv, index=undefined) => {
    let dbg_tag = 'ContentHandler::createOrUpdatePost:';
    console.debug(dbg_tag + 'posting text: ', post_text.value);
    console.debug(dbg_tag + 'oauthToken: ', oauthToken);
    m_oauthToken = oauthToken;
    console.debug(dbg_tag + ' index ', index);
    let blogPostedMsg = document.createElement('p');
    blogPostedMsg.innerText = 'Saving blog post ...';
    msgAreaDiv.appendChild(blogPostedMsg);

    if ((postObjArr === undefined) || (postObjArr.length < 1)){
      postObjArr = await gitHubBroker.get_posts_from_file(oauthToken);
    }
    if ((index !== undefined) && (index !== '')){
      //update
      postObjArr[index].post_content = post_text.value;
    } else {
      //create
        postObjArr.push(createPostObj(post_text.value));
    }

    gitHubBroker.save_post(JSON.stringify(postObjArr), oauthToken,
      'index.json')
      .then((blogPostResult) => {
        post_text.value='';
        blogPostSubmitted(msgAreaDiv);
      });
    };

 /**
   * callback function for actions after ContentHandler
   * submits a blog post
   *
   * @param blogPostInfo: information about blog post
   */
  blogPostSubmitted = (msgArea) => {
    let dbg_tag = 'ContentHandler::blogPostSubmitted:';
    console.debug(dbg_tag, ' msgArea ', msgArea);
    msgArea.firstChild.innerText = 'Blog entry posted at ' + Date();
    setTimeout(clearBlogPostedMsg, 3000);
    m_msgArea = msgArea;
  };

  /**
   * called to clear message displayed after blog posted
   *
   */
  clearBlogPostedMsg = () => {
    m_msgArea.removeChild(m_msgArea.lastElementChild);
  };


  /**
   * creates post object from post text
   *
   * @param post_text: post text
   */
  createPostObj = (post_text) => {
     let d = new Date();
     result = {};
     result.post_change_time = d.getTime();
     result.post_content = post_text;
     return result;
  };

  /**
   * displays a list of posts. user may click on a post to
   * view and edit
   *
   * @param blog_posts: div where we display the list
   */
   ContentHandler.prototype.listPosts = (blog_posts) => {
     while(blog_posts.firstChild){
       blog_posts.removeChild(blog_posts.firstChild);
     }
     for (index in postObjArr){
       let postObjDiv = document.createElement('div');
       let postObjLink = document.createElement('a');
       postObjLink.index = index;
       postObjLink.addEventListener('click', (event) =>{
         this.loadBlogPostForm(blog_posts, event);
       });
       let postDate = new Date();
       postDate.setTime(postObjArr[index].post_change_time);
       postObjLink.innerText = postDate.toString();
       postObjDiv.appendChild(postObjLink);
       blog_posts.appendChild(postObjDiv);
     }
   };

  const editorMsgHtml = `<p>Write a blog post in the text area below.
   Write your post in HTML.  You must enter a Github issued OAUTH
   token value in the text box below in order to save a post.
   Note: this editor saves what you write to the github repository that
   holds the data for your github pages site. </p>
   <p>It takes a few minutes for whatever happens behind the scenes at
   Github for your post to become visible in the Github pages site.</p>
   <h2>Write a Blog Post</h2>
  `;
  /**
   * loads blog posting form
   *
   * @param blogPostDiv: div that we attach blog posting form to
   */
  ContentHandler.prototype.loadBlogPostForm = (blogPostDiv,
      event=undefined)=>{
    while(blogPostDiv.firstChild){
      blogPostDiv.removeChild(blogPostDiv.firstChild);
    }
    let editorMsg = document.createElement('div');
    editorMsg.innerHTML = editorMsgHtml;
    blogPostDiv.appendChild(editorMsg);

    let oauthText = document.createElement('INPUT');
    oauthText.setAttribute('type', 'text');
    oauthText.setAttribute('id', 'tokenText');
    oauthText.setAttribute('name', 'tokenText');
    let oauthTextDiv = document.createElement('div');
    oauthTextDiv.appendChild(oauthText);
    blogPostDiv.appendChild(oauthTextDiv);

    let textArea = document.createElement('TEXTAREA');
    textArea.setAttribute('id', 'post_text') ;
    textArea.setAttribute('name', 'post_text');
    textArea.setAttribute('rows', '20');
    textArea.setAttribute('cols', '80');
    let index = undefined;
    if (event){
      textArea.value = postObjArr[event.target.index].post_content;
      index= event.target.index;
    }

    let textAreaDiv = document.createElement('div');
    textAreaDiv.appendChild(textArea);
    blogPostDiv.appendChild(textAreaDiv);

    let msgArea = document.createElement('div');
    blogPostDiv.appendChild(msgArea);

    let savePostLink = document.createElement('a');
    savePostLink.innerText = "Save Post";
    savePostLink.addEventListener("click", () => {
      this.createOrUpdatePost(textArea, oauthText.value, msgArea,
        index);
    });
    savePostLinkDiv = document.createElement('div');
    savePostLinkDiv.appendChild(savePostLink);
    blogPostDiv.appendChild(savePostLinkDiv);
  };
 };

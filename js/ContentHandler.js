/**
 * uses functionality defined in site_functions.js
 *
 * 
 * we rely on code at https://crockford.com/javascript/private.html
 * for object encapsulation
 * TODO - verify these encapsulation techniques actually work
 */
function ContentHandler(){
  let gitHubBroker = new GitHubBroker();

  //save posts to reduce number of times we access index.json
  //TODO - think about whether or not this is necessary
  let postObjArr = [];
 
  //for saving the timer ID that setTimeout returns. 
  var timerHandle;
 /**
   * callback function for actions after ContentHandler
   * submits a blog post
   * 
   * @param blogPostInfo: information about blog post
   */
  blogPostSubmitted = (msgArea) => {
    let dbg_tag = 'ContentHandler::blogPostSubmitted:';
    console.debug(dbg_tag, ' msgArea ', msgArea);
    let blogPostedMsg = document.createElement('p');
    blogPostedMsg.innerText = 'Blog entry posted at ' + Date();
    msgArea.appendChild(blogPostedMsg);
    timerHandle = setTimeout(clearBlogPostedMsg, 3000);
    this.msgArea = msgArea;
    console.debug(dbg_tag, ' timerHandle ', timerHandle);
  }
  
  /**
   * called to clear message displayed after blog posted
   *
   */
  clearBlogPostedMsg = () => {
    let dbg_tag = 'ContentHandler::clearBlogPostedMsg:';
    console.debug(dbg_tag, ' msgArea ', this.msgArea);
    msgArea.removeChild(msgArea.lastElementChild);
    }


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
     return result
  }


  /**
   * fetches post using OAUTH token for authentication
   *
   * @param tokenText: DOM text input element, mean to hold an OAUTH token
   */
  ContentHandler.prototype.fetchPosts = async (blogPostsDiv, oauthToken) => {
    let dbg_tag = 'ContentHandler::fetchPosts:';
    console.debug(dbg_tag, ' oauthToken = ', oauthToken);
    this.blogPostsDiv = blogPostsDiv;
    postObjArr = await gitHubBroker.get_posts_from_file(oauthToken);
    console.debug(dbg_tag, ' postObjArr ', postObjArr);
    postObjArr.sort( (a,b) => {
      keyA = a.post_change_time;
      keyB = b.post_change_time;
      if (keyA < keyB) return 1;
      if (keyA > keyB) return -1;
      return 0;
      });
    while(this.blogPostsDiv.firstChild){
      this.blogPostsDiv.removeChild(this.blogPostsDiv.firstChild);
    }
    for (i=0; (i < postObjArr.length && i < max_posts_display); i++){
      console.debug(dbg_tag, ' postObjArr '+i, postObjArr[i]);
      postDiv = document.createElement('div');
      postDate = new Date(1970,0,1);
      postDate.setTime(postObjArr[i][post_change_time]);
      postDiv.innerHTML = '<p>' + postDate + '</p>';
      postDiv.innerHTML += postObjArr[i][post_content];
      postDiv.setAttribute('class', 'blogpost');
      this.blogPostsDiv.appendChild(postDiv);
    }
  }
  
  const post_content = 'post_content';
  const post_change_time = 'post_change_time';
  const max_posts = 10000;
  const max_posts_display = 5;
  /**
   * invoked from github broker for processing file contents,
   * in the current case, this means adding the blog post contents
   * to a div 
   *
   * @param postJson: contents of a blog post file, which is JSON data, possibly
   * containing illegal line breaks that we remove before parsing the JSON.
   */
  ContentHandler.prototype.getPostsCallback = (postJson) => {
    let dbg_tag = 'ContentHandler::getPostsCallback:';
    console.debug(dbg_tag, ' postJson ', postJson);  
    postObj = JSON.parse(postJson.replace(/(\r\n\t|\n|\r\t)/gm,""));
    if (postObjArr.length <= max_posts){
      postObjArr.push(postObj);
    } else {
      console.debug("maximum number of posts exceeded.");
    }
    postObjArr.sort( (a,b) => {
      keyA = a.post_change_time;
      keyB = b.post_change_time;
      if (keyA < keyB) return 1;
      if (keyA > keyB) return -1;
      return 0;
      });
    while(this.blogPostsDiv.firstChild){
      this.blogPostsDiv.removeChild(this.blogPostsDiv.firstChild);
    }
    for (i=0; (i < postObjArr.length && i < max_posts_display); i++){
      console.log(dbg_tag, ' postObjArr '+i, postObjArr[i]);
      postDiv = document.createElement('div');
      postDate = new Date(1970,0,1);
      postDate.setTime(postObjArr[i][post_change_time]);
      postDiv.innerHTML = '<p>' + postDate + '</p>';
      postDiv.innerHTML += postObjArr[i][post_content];
      postDiv.setAttribute('class', 'blogpost');
      this.blogPostsDiv.appendChild(postDiv);
    }
  }

  /**
   * should be temporary method for saving all  previous posts to a file
   *
   * @param oathToken: github issued authorization token
   */
  ContentHandler.prototype.create_index_json = (oauthToken) => {
      gitHubBroker.create_index_json(oauthToken);
  }

  ContentHandler.prototype.createPost = async (post_text, oauthToken, msgAreaDiv) => {
    console.debug('ContentHandler::createPost posting text: ', post_text.value);
    console.debug('ContentHandler::createPost oauthToken: ', oauthToken);
    if ((postObjArr === undefined) || (postObjArr.length < 1)){
      postObjArr = await gitHubBroker.get_posts_from_file(oauthToken);
    }
    postObjArr.push(createPostObj(post_text.value));
    gitHubBroker.save_post(JSON.stringify(postObjArr), oauthToken, 
      'index.json')
      .then((blogPostResult) => {
        post_text.value='';
        blogPostSubmitted(msgAreaDiv);
      });
    }
 }

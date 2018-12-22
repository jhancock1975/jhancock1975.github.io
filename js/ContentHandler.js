/**
 * uses functionality defined in site_functions.js
 *
 * 
 * we rely on code at https://crockford.com/javascript/private.html
 * for object encapsulation
 * TODO - verify these encapsulation techniques actually work
 */
function ContentHandler(){
  this.gitHubBroker = new GitHubBroker();
  //save reference to this for use in privileged methods
  self = this;
  self.postObjArr = [];
  //self.fetchPosts(blogPostsDiv);
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
    self.msgArea = msgArea;
    console.debug(dbg_tag, ' timerHandle ', timerHandle);
  }
  
  /**
   * called to clear message displayed after blog posted
   *
   */
  clearBlogPostedMsg = () => {
    let dbg_tag = 'ContentHandler::clearBlogPostedMsg:';
    console.debug(dbg_tag, ' msgArea ', self.msgArea);
    msgArea.removeChild(msgArea.lastElementChild);
    }

}
/**
 * fetches post using OAUTH token for authentication
 *
 * @param tokenText: DOM text input element, mean to hold an OAUTH token
 */
ContentHandler.prototype.fetchPosts =  (blogPostsDiv, oauthToken) => {
  dbg_tag = 'ContentHandler::fetchPosts:';
  self.postObjArr = [];
  console.debug(dbg_tag, ' oauthToken = ', oauthToken);
  self.blogPostsDiv = blogPostsDiv;
  self.gitHubBroker.get_posts(oauthToken, self.getPostsCallback);
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
  if (self.postObjArr.length <= max_posts){
    self.postObjArr.push(postObj);
  } else {
    console.debug("maximum number of posts exceeded.");
  }
  self.postObjArr.sort( (a,b) => {
    keyA = a.post_change_time;
    keyB = b.post_change_time;
    if (keyA < keyB) return 1;
    if (keyA > keyB) return -1;
    return 0;
    });
  while(self.blogPostsDiv.firstChild){
    self.blogPostsDiv.removeChild(self.blogPostsDiv.firstChild);
  }
  for (i=0; (i < self.postObjArr.length && i < max_posts_display); i++){
    console.log(dbg_tag, ' postObjArr '+i, self.postObjArr[i]);
    postDiv = document.createElement('div');
    postDate = new Date(1970,0,1);
    postDate.setTime(self.postObjArr[i][post_change_time]);
    postDiv.innerHTML = '<p>' + postDate + '</p>';
    postDiv.innerHTML += self.postObjArr[i][post_content];
    postDiv.setAttribute('class', 'blogpost');
    self.blogPostsDiv.appendChild(postDiv);
  }
}

ContentHandler.prototype.createPost = (post_text, oauthToken, msgAreaDiv) => {
  console.debug('ContentHandler::createPost posting text: ', post_text.value);
  console.debug('ContentHandler::createPost oauthToken: ', oauthToken);
  self.gitHubBroker.save_post(post_text.value, oauthToken)
    .then((blogPostResult) => {
      post_text.value='';
      blogPostSubmitted(msgAreaDiv);
    });
  }


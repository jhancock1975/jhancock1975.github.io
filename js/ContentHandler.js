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

  /**
   * fetches post using OAUTH token for authentication
   *
   * @param tokenText: DOM text input element, mean to hold an OAUTH token
   */
  ContentHandler.prototype.fetchPosts = async (blogPostsDiv) => {
    let dbg_tag = 'ContentHandler::fetchPosts:';
    postObjArr = await gitHubBroker.get_posts_from_file();
    console.debug(dbg_tag, ' postObjArr ', postObjArr);
    postObjArr.sort( (a,b) => {
      keyA = a.post_change_time;
      keyB = b.post_change_time;
      if (keyA < keyB) return 1;
      if (keyA > keyB) return -1;
      return 0;
      });
    while(blogPostsDiv.firstChild){
      blogPostsDiv.removeChild(blogPostsDiv.firstChild);
    }
    for (i=0; (i < postObjArr.length && i < max_posts_display); i++){
      console.debug(dbg_tag, ' postObjArr '+i, postObjArr[i]);
      postDiv = document.createElement('div');
      postDate = new Date(1970,0,1);
      postDate.setTime(postObjArr[i][post_change_time]);
      postDiv.innerHTML = '<p>' + postDate + '</p>';
      postDiv.innerHTML += postObjArr[i][post_content];
      postDiv.setAttribute('class', 'blogpost');
      blogPostsDiv.appendChild(postDiv);
    }
  }

 ContentHandler.prototype.createPost = async (post_text, oauthToken, msgAreaDiv) => {
    console.debug('ContentHandler::createPost posting text: ', post_text.value);
    console.debug('ContentHandler::createPost oauthToken: ', oauthToken);
    let blogPostedMsg = document.createElement('p');
    blogPostedMsg.innerText = 'Saving blog post ...';
    msgArea.appendChild(blogPostedMsg);

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
  }

  /**
   * called to clear message displayed after blog posted
   *
   */
  clearBlogPostedMsg = () => {
    m_msgArea.removeChild(msgArea.lastElementChild);
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
   * loads blog posting form
   *
   * @param blogPostDiv: div that we attach blog posting form to
   */
  ContentHandler.prototype.loadBlogPostForm = (blogPostDiv)=>{
    while(blogPostDiv.firstChild){
      blogPostDiv.removeChild(blogPostDiv.firstChild);
    }
    populateAreaHelper('blogPostForm.html', blogPostDiv);
   } /**
    * this helper function factors out code that we call
    * to load various parts of the site's page. We only use
    * this to load the blog post form but we anticipate that
    * we made need it for more later.
    *
    * @param htmlFragmentName: name of a file in the html/ directory.
    * this directory is in the root of the site
    * @param parentDiv: div that the html fragment will get
    * attached to.
    */
   populateAreaHelper = (htmlFragmentName, parentDiv) => {
     let dbg_tag = "ContentHandler::populateAreaHelper:";
     fetch(site_settings[site_url]+'/html/'+htmlFragmentName,
       {method: 'GET'}).then(resp => resp.text()).then(text => {
         contentDiv = document.createElement('div');
         console.debug(dbg_tag, ' text ', text)
         contentDiv.innerHTML = text;
         parentDiv.appendChild(contentDiv);
         console.debug(dbg_tag, 'parentDiv.firstElementChild',
           parentDiv.firstElementChild)
       });
   }
 }

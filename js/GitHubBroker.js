function GitHubBroker(){
  /**
   * Convenience method for making API call.
   * 
   * @author: jhancock1975
   * @param api_category: github API category name, example: repos
   * @param api_method: github API endpoint method, example: contents
   * @param api_params: github method parameters, example: posts (the name of
   * some directory)
   */
  github_get_request = async(api_category, api_method, api_params, tokenText) => {
    url_str = site_settings[base_url]+'/'+ api_category + '/'
      + site_settings[user_id] 
      + '/' + site_settings[repo_name] + '/' + api_method + '/' + api_params;
    console.debug('url_str = ', url_str);
    var headers_obj = {'Accept': 'application/vnd.github.v3+json'};
    if ((tokenText !== undefined) && (tokenText !== "")){
      console.debug('setting oath token value ', tokenText);
      headers_obj['Authorization'] = 'token ' + tokenText;
    } else {
      console.debug('The token_val is blank or undefined.');
      console.debug('I am not using authorization for API calls.');
    }
    var response = await fetch(url_str, 
                           {method : 'GET', 
                            headers: headers_obj
                           });
    var response_json = await response.json();
    return response_json;
  }

  const name = 'name';
  const content = 'content';
  const html_url = 'html_url';
  /**
   * This function gets blog posts from a github repository
   * it expects there to be a directory called posts in the
   * top level of the repository, and attaches the posts
   * to child divs of postDiv
   *
   * @param postDiv: DOM object that we attach blog posts to
   */
  GitHubBroker.prototype.get_posts = async(postDiv, tokenText) => {
     github_get_request('repos', 'contents', 'posts', tokenText)
       .then((blog_posts) => {
         //we have the list of blog posts
         //TODO: recursively traverse contents
         blog_posts.map((blog_post) => {
           github_get_request('repos', 'contents', 'posts'+'/'+blog_post[name], tokenText)
             .then((blog_post) => {
               //we have the individual posts
               console.debug('blog_post ', blog_post);
               blog_url = blog_post[html_url];
               var should_add = false;
               if (! postDiv.url_list){
                 postDiv.url_list = [blog_url];
                 should_add = true;
               }
               if (!postDiv.url_list.includes(blog_url)){
                 postDiv.url_list.push(blog_url);
                 should_add = true;
               }
               if (should_add){
                var newPostDiv = document.createElement('div');
                newPostDiv.innerHTML = atob(blog_post[content]);
                postDiv.appendChild(newPostDiv);
               } else {
                 console.debug('we already have a div that shows ', blog_url);
               }
           })
         })
     })
  }

  GitHubBroker.prototype.save_post = async(post_text, oauthToken) => {
    console.debug("saving post text ", post_text);
    console.debug("token = ", oauthToken);

    //take the code from
    // https://gist.github.com/iktash/31ccc1d8582bd9dcb15ee468c7326f2d    
    // these are the steps to do:
    var commit_sha = await getCurrentCommitSHA(oauthToken);
    var tree_sha = await getCurrentTreeSHA(oauthToken, commit_sha);
    await createFiles(post_text, oauthToken);
    // createTree
    // createCommit
    // updateHead
  }

  /**
   * retrieves current commit sha from repository
   * 
   * @param oauthToken - user supplied oauth token, user must request
   *   token from Github
   */
  getCurrentCommitSHA = async(oauthToken, getCurrentTreeSHA) => {
    console.debug('getting currrent commit sha');
    console.debug('oauth token = ', oauthToken);
    var ref = await github_get_request('repos', 'git/refs',
      'heads/'+site_settings[branch_name], oauthToken);
    return ref.object.sha;
    } 

   /**
    * retrieves current tree SHA
    *
    * @param oauthToken - user supplied oauth token, user must request
    *   token from Github
    * 
    * @param sha - should be SHA value from some commit
    */
    getCurrentTreeSHA = async(oauthToken, sha) =>{
      console.debug("getCurrentTreeSHA::oauthToken = ", oauthToken);
      console.debug("getCurrentTreeSHA::sha= ", sha);
      var commit = await github_get_request('repos', 'git/commits',
        sha, oauthToken);
      console.debug('getCurrentTreeSha:: tree sha = ', commit.tree.sha);
      return commit.tree.sha;
    }
  
 /**
  * creates blob objects for files to commit
  *
  * @param post_text - text to save as blog post
  *
  * @param oauthToken - user supplied oauth token, user must request
  *   token from Github
  *
  * @param sha - should be SHA value of current tree
  */
   createFiles = async(post_text, oauthToken) => {
     var blob = await github_get_request('repos', 'git/blobs', "",
       oauthToken, 'POST', 
       JSON.stringify({
         content: {content: btoa(post_text), 
         encoding: 'base64'}, 
         path: (new Date().getTime()+".html")
         }));
      console.debug('blob = ', blob);
   }
}

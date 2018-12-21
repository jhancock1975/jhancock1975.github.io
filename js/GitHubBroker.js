function GitHubBroker(){
  const body = 'body';
  const contents = 'contents';
  /**
   * Convenience method for making API call.  
   * 
   * @author: jhancock1975
   * @param api_category: github API category name, example: repos
   * @param api_method: github API endpoint method, example: contents
   * @param api_params: github method parameters, example: posts (the name of
   * some directory)
   */

  github_api_call = async(path, verb, oauthToken, request_data) =>{
    let dbg_tag = 'GitHubBroker::github_api_call:'; 
    console.debug(dbg_tag, ' request_data = ', request_data);

    let url_str = site_settings[base_url]+'/'+path;
    console.debug(dbg_tag, ' url_str = ', url_str);

    let headers_obj = {'Accept': 'application/vnd.github.v3+json'};

    if ((oauthToken !== undefined) && (oauthToken!== "")){
      console.debug(dbg_tag, 'setting oauth token value ', oauthToken);
      headers_obj['Authorization'] = 'token ' + oauthToken;
    } else {
      console.debug('The token_val is blank or undefined.');
      console.debug('I am not using authorization for API calls.');
    }

    let fetch_obj = {method: verb, headers: headers_obj};

    if ((request_data !== undefined) && (request_data !== '')){
      fetch_obj[body] = request_data;
    }

    var response = await fetch(url_str, fetch_obj);
    var response_json = await response.json();
    console.debug(dbg_tag, ' response_json ', response_json);
    return response_json;
  }

  /**
     * This function gets blog posts from a github repository
     * it expects there to be a directory called posts in the
     * top level of the repository, and invokes content handler's
     * callback to process post contents.
     * Currently this method only fetches files with a file name that
     * ends with .json.
     *
     * @param tokenText: user supplied oauth token, user must request
     *  token from Github
     *
     * @param contentHandlerCallback: callback function for processing file
     * contents
     */
    GitHubBroker.prototype.get_posts = async(tokenText,
      contentHandlerCallback) => {
       let dbg_tag = 'GitHubBroker::get_posts:';
       console.debug(dbg_tag, ' tokenText ', tokenText);
       let path='repos' 
         + '/' + site_settings[user_id]
         + '/' + site_settings[repo_name]
         + '/' + contents
         + '/' + 'posts'; 
       github_api_call(path, 'GET', tokenText)
         .then((blog_posts) => {
           //we have the list of blog posts
           //TODO: recursively traverse contents
           blog_posts.map((blog_post) => {
             if (blog_post[name].endsWith('.json')){
               github_api_call(path + '/' + blog_post[name], 'GET', tokenText)
                 .then((blog_post) => {
                   //we have the individual posts
                   console.debug(dbg_tag, 'blog_post ', blog_post);
                   contentHandlerCallback(atob(blog_post[content]));
              })
           }
           })
       })
  }

  const name = 'name';
  const content = 'content';
  const html_url = 'html_url';
  const sha = 'sha';
  const commit = 'commit';
  GitHubBroker.prototype.save_post = async(post_text, oauthToken) => {
    console.debug("saving post text ", post_text);
    console.debug("token = ", oauthToken);

    //take the code from
    // https://gist.github.com/iktash/31ccc1d8582bd9dcb15ee468c7326f2d    
    // these are the steps to do:
    var commit_sha = await getCurrentCommitSHA(oauthToken);

    var tree_sha = await getCurrentTreeSHA(oauthToken, commit_sha);

    var blob_sha = await createBlob(post_text, oauthToken);

    var new_commit_tree_sha = await createTree(tree_sha, blob_sha, oauthToken,
      post_text);

    var new_commit_sha = await createCommit(commit_sha, new_commit_tree_sha, 
      oauthToken);
    updateHead(new_commit_sha, oauthToken);
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
    let ref = await github_api_call(
      'repos'
      + '/' + site_settings[user_id]
      + '/' + site_settings[repo_name] 
      + '/git/refs/heads/'
      +site_settings[branch_name], 'GET', oauthToken);
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
      let commit = await github_api_call(
          'repos'
        + '/' + site_settings[user_id]
        + '/' + site_settings[repo_name] 
        + '/' + 'git/commits'
        + '/' + sha, 'GET', oauthToken);
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
   createBlob = async(post_text, oauthToken) => {
     let blob = await github_api_call(
      'repos'
        + '/' + site_settings[user_id]
        + '/' + site_settings[repo_name] 
        +  '/git/blobs',
       'POST',
       oauthToken, 
       JSON.stringify({content: btoa(jsonify(post_text)), 
         encoding: 'base64'}));
      console.debug('blob = ', blob);
      return blob.sha;
   }

  /**
   * creates json representation of post
   *
   * @param post_text: post text
   */
   jsonify = (post_text) => {
     let d = new Date();
     result = {};
     result.post_change_time = d.getTime();
     result.post_content = post_text;
     return JSON.stringify(result);
    }

  /**
   * creates a tree object from the blob
   *
   * @param tree_sha: current tree sha
   * @param blob_sha: should have been just created
   * @param oauthToken: user supplied oauth token, user must request
   *   token from Github
   */
  createTree = async(tree_sha, blob_sha, oauthToken) => {
    let blob_obj = [{sha: blob_sha, 
      path: 'posts/' + guid() + '_' + new Date().getTime() + ".json",
      mode: '100644',
      type: 'blob'}];
   let to_push = {tree: blob_obj, base_tree: tree_sha}; 
   let new_commit_tree_obj = await github_api_call(
       'repos'
        + '/' + site_settings[user_id]
        + '/' + site_settings[repo_name] 
        + '/git/trees',
        'POST',
        oauthToken, 
        JSON.stringify(to_push));
   console.debug(new_commit_tree_obj);
   return new_commit_tree_obj.sha; 
  }
  /**
   * generates pseduo-guid to help overcome question of simultaneous posts
   * this code is copied from
   * https://stackoverflow.com/posts/105074/revisions
   * StackOverflow.com user Andy Stehno user response, October 16, 2016.
   * accessed December 21, 2018.
   * 
   * @return: an unreliable guid, according to StackOverflow posting
   */
  guid = () => {
    s4 = ()=> {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4()
      + s4();
  }

  /**
   * creates a commit
   *
   * @param commit_sha: sha  of previous commit
   * @param new_commit_tree_sha: sha of commit tree  
   * @param oauthToken: user supplied oauth token, user must request
   *  token from Github
   */
  createCommit = async(commit_sha, new_commit_tree_sha, oauthToken) => {
    let commit_data = {message : 'saving blog post',
      tree: new_commit_tree_sha,
      parents : [commit_sha]};
    let post_data = JSON.stringify(commit_data);
    let commit_obj = await github_api_call(
      'repos'
      + '/' + site_settings[user_id]
      + '/' + site_settings[repo_name] 
      + '/git/commits', 
      'POST',
      oauthToken, 
      post_data);
    console.debug('createCommit::commit_obj ', commit_obj);
    return commit_obj.sha;
  } 

 /** updates head to latest commit
  * 
  * @param new_commit_sha: sha of latest commit to update the head to point to
  */
  updateHead = async(new_commit_sha, oauthToken) => {

    console.debug('updateHead:: new_commit_sha = ', new_commit_sha);

    let patch_data = JSON.stringify({sha: new_commit_sha});

    let result = await github_api_call(
      'repos'
      + '/' + site_settings[user_id]
      + '/' + site_settings[repo_name] 
      + '/git/refs/heads/' 
      +site_settings[branch_name],
      'PATCH',
      oauthToken, 
      patch_data);

    console.debug('updateHead::result = ', result);    
  }
}

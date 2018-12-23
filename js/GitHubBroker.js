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
  GitHubBroker.prototype.get_posts_from_file = async() => {
    let dbg_tag = 'GitHubBroker::get_posts_from_file';
    let fetch_obj = {method: 'GET'};
    // we are using the repository name for the base url because
    // the github.io free web hosting they give uses the repository
    // name as the host name
    let blog_posts_url = 'https://' + site_settings[repo_name]
      +'/posts/index.json';
    var response = await fetch(blog_posts_url , fetch_obj);
    var blog_posts_arr = await response.json();
    console.debug(dbg_tag, ' blog_posts_arr ', blog_posts_arr);
    return blog_posts_arr;
  }

   //temporary list to hold all posts for
   //writing to index.json
   //this list should go away in the near future
   var file_contents_arr = [];

   /**
    * retrieves file contents from github using path
    * 
    * @param  file_path - path to file relative to repository root - 
    *  it is not necessary to give the repository or repository owner
    *  name
    *
    * @param tokenText: user supplied oauth token, user must request
    *  token from Github
    *
    *  @return  base 64 decoded equivalent of file contents
    */
  git_file_contents = (file_path, tokenText) => {
    let dbg_tag = 'GitHubBroker::git_file_contents:';
    console.log(dbg_tag, ' file_path ', file_path, 'token text ', tokenText);
    github_api_call(file_path, 'GET', tokenText)
      .then((blog_post) => {
      //we have the individual posts
      console.debug(dbg_tag, 'blog_post ', blog_post);

      //this is temporary code to store all posts in a file
      //index.json
      file_contents_arr.push (
         JSON.parse(
          atob(blog_post[content])
           .replace(/(\r\n\t|\n|\r\t)/gm,"")));

      console.debug(dbg_tag, ' result ', result); 
      return result;
    });
  }

  const name = 'name';
  const content = 'content';
  const html_url = 'html_url';
  const sha = 'sha';
  const commit = 'commit';


  /**
   * saves json format string to file in repository with file name
   * file_name to posts/file_name
   *
   * @param all_posts_json: json format record of all posts
   * 
   * @param oauthToken: github issued authorization token
   *
   * @param file_name: name of file to save (e.g. index.json)
   */
  GitHubBroker.prototype.save_post = async(all_posts_json, oauthToken,
    file_name) => {
    let dbg_tag = "GitHubBroker::save_post:";
    console.debug(dbg_tag, "saving post text ", all_posts_json);
    console.debug(dbg_tag, "token = ", oauthToken);
    
    //use default file name of guid plus the date if none supplied
    file_name = file_name || guid() + '_' + new Date().getTime() + ".json";
    console.debug(dbg_tag, ' file_name ', file_name);

    //take the code from
    // https://gist.github.com/iktash/31ccc1d8582bd9dcb15ee468c7326f2d    
    // these are the steps to do:
    var commit_sha = await getCurrentCommitSHA(oauthToken);

    var tree_sha = await getCurrentTreeSHA(oauthToken, commit_sha);

    var blob_sha = await createBlob(all_posts_json, oauthToken);

    var new_commit_tree_sha = await createTree(tree_sha, blob_sha, oauthToken,
      file_name);

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
       JSON.stringify({content: btoa(post_text), 
         encoding: 'base64'}));
      console.debug('blob = ', blob);
      return blob.sha;
   }

  /**
   * creates a tree object from the blob
   *
   * @param tree_sha: current tree sha
   * @param blob_sha: should have been just created
   * @param oauthToken: user supplied oauth token, user must request
   *   token from Github
   */
  createTree = async(tree_sha, blob_sha, oauthToken, file_name) => {
    let dbg_tag = 'GitHubBroker::createTree:';
    console.debug(dbg_tag, ' file_name ', file_name);
    let blob_obj = [{sha: blob_sha, 
      path: 'posts/' + file_name,
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
   console.debug(dbg_tag, ' new_commit_tree_obj ', new_commit_tree_obj);
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

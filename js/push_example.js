/**
 * this code copied from:
 * https://medium.freecodecamp.org/pushing-a-list-of-files-to-the-github-with-javascript-b724c8c09b66
 * accessed December 18, 2018.
 * probably would have been better to use the gist linked to in the tutorial:
 * https://gist.github.com/iktash/31ccc1d8582bd9dcb15ee468c7326f2d
 */

function GithubAPI(auth) {
    let repo;
    let filesToCommit = [];
    let currentBranch = {};
    let newCommit = {};
    this.gh = new GitHub(auth);
   

    /**
     * Sets the current repository to make push to
     * @public
     * @param {string} userName Name of the user who owns the repository
     * @param {string} repoName Name of the repository
     * @return void
     */ 
    this.setRepo = function(userName, repoName) {
      repo = this.gh.getRepo(userName, repoName);
    }

    /**
     * Sets the current branch to make push to. If the branch doesn't exist yet,
     * it will be created first
     * @public
     * @param {string} branchName The name of the branch
     * @return {Promise}
     */
    this.setBranch = function(branchName) {
      return repo.listBranches()
        .then((branches) => {
            let branchExists = branches.data
                .find( branch => branch.name === branchName );
            if (!branchExists) {
                return repo.createBranch('master', branchName)
                    .then(() => {
                        currentBranch.name = branchName;
                    });
            } else {
                currentBranch.name = branchName;
            }
        });
    }

    /**
     * Makes the push to the currently set branch
     * @public
     * @param  {string}   message Message of the commit
     * @param  {object[]} files   Array of objects (with keys 'content' and
     * 'path'),
     *                            containing data to push
     * @return {Promise}
     */
    this.pushFiles = function(message, files) {
      return getCurrentCommitSHA()
        .then(getCurrentTreeSHA)
        .then( () => createFiles(files) )
        .then(createTree)
        .then( () => createCommit(message) )
        .then(updateHead)
        .catch((e) => {
            console.error(e);
        });
     }

    /**
     * Sets the current commit's SHA
     * @private
     * @return {Promise}
     */
    function getCurrentCommitSHA() {
      return repo.getRef('heads/' + currentBranch.name)
        .then((ref) => {
            currentBranch.commitSHA = ref.data.object.sha;
        });
    }


    /**
     * Sets the current commit tree's SHA
     * @private
     * @return {Promise}
     */
    function getCurrentTreeSHA() {
      return repo.getCommit(currentBranch.commitSHA)
        .then((commit) => {
            currentBranch.treeSHA = commit.data.tree.sha;
        });
    }

    /**
     * Creates blobs for all passed files
     * @private
     * @param  {object[]} filesInfo Array of objects (with keys 'content' and
     * 'path'),
     *                              containing data to push
     * @return {Promise}
     */
    function createFiles(files) {
      let promises = [];
      let length = filesInfo.length;
      for (let i = 0; i < length; i++) {
          promises.push(createFile(files[i]));
       }
      return Promise.all(promises);
    }

    /**
     * Creates a blob for a single file
     * @private
     * @param  {object} fileInfo Array of objects (with keys 'content' and
     * 'path'),
     *                           containing data to push
     * @return {Promise}
     */
    function createFile(file) {
      return repo.createBlob(file.content)
        .then((blob) => {
            filesToCommit.push({
                sha: blob.data.sha,
                path: fileInfo.path,
                mode: '100644',
                type: 'blob'
            });
        });
     }

    /**
     * Creates a new tree
     * @private
     * @return {Promise}
     */
    function createTree() {
     return repo.createTree(filesToCommit, currentBranch.treeSHA)
        .then((tree) => {
            newCommit.treeSHA = tree.data.sha;
        });
    }

    /**
     * Creates a new commit
     * @private
     * @param  {string} message A message for the commit
     * @return {Promise}
     */
    function createCommit(message) {
      return repo.commit(currentBranch.commitSHA, newCommit.treeSHA, message)
        .then((commit) => {
            newCommit.sha = commit.data.sha;
        });
    }

    /**
     * Updates the pointer of the current branch to point the newly created
     * commit
     * @private
     * @return {Promise}
     */
    function updateHead() {
      return repo.updateHead(
        'heads/' + currentBranch.name,
        newCommit.sha);
    }
};

if ((token_val === '') || (token_val === undefined)){
  throw 'Please set a value for the token';
else {
  let api = new GithubAPI({token: token_val});
  api.setRepo(site_settings[user_id], site_settings[repo_name]);
  api.setBranch(site_settings[branch_name])
      .then( () => api.pushFiles(
          'Making a commit with my adorable files',
          [
              {content: 'You are a Wizard, Harry', path: 'harry.txt'},
              {content: 'May the Force be with you', path: 'jedi.txt'}
          ])
      )
      .then(function() {
          console.log('Files committed!');
      });
}

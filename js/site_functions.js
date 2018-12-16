list_files = async (user_id) => {
   url_str = 'https://api.github.com/repos/' + user_id + '/jhancock1975.github.io/contents/';
   response = await fetch('https://api.github.com/repos/jhancock1975/jhancock1975.github.io/contents/');
   myJson = await response.json(); //extract JSON from the http response
  console.log("myJson ", myJson)
}

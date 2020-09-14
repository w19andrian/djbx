function getResult(event) {
  event.preventDefault();
  document.getElementById('select-result').innerHTML = '' ;

  /* get input value from HTML form */
  const frm = document.getElementById('searchInp');
  const inp = frm.value;

  fetch('/v1/search', {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify({q: inp})
  })
  .then(response => response.json())
  .then((data) => {
    var append_html_result = '' ;
    var append_html_button = '<p><button id="button-queue" type="Add to Queue" class="btn btn-queue" onClick="addQueue(event)">add to queue</button></p>'
    data.results.forEach(d => {
      var artist = ''
      for(var i in d.img){
        if (d.img[i].height == 64 && d.img[i].width == 64) {
          var img = d.img[i].url;
        }        
      }
      for(var j  = 0 ; j < d.artist.length ; j++){
        if(j !== (d.artist.length - 1)){
          artist += d.artist[j].name + ',' ;
        } else {
          artist += d.artist[j].name ;
        }
      }
      append_html_result += '<option value="' + 
        d.id +'"><p><img src="' +
        img +'"><span>' + 
        d.track + '</span><br><span>' + 
        artist + '</span><br><span>' + 
        d.album.type + '-' + 
        d.album.name + '-' + 
        d.album.release_date + '</span></p></option>'
      
      document.getElementById('select-result').innerHTML = append_html_result ; 
    })
    document.getElementById('add-queue').innerHTML = append_html_button ;
  })
  .catch(function(data){console.log(data)})
}

function addQueue(event) {
  event.preventDefault();
  const selected = document.getElementById('select-result');
  const id = selected.options[selected.selectedIndex].value ;

  console.log('SELECTED: ' + id)
  fetch('/v1/queue?id=' + id, {
    method: 'GET'
  })
  .then(response => response.json())
  .then((data) => {
    console.log('TRACK ADDED TO QUEUE')
  })
  .catch(function(data){console.log(data)})
}

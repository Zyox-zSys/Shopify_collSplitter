(function Shopify_CollectionSplitter() {'use strict';

  function dbgLog(msg) {if(collSplitter.debug) {console.log(msg);} return msg;}

  let collSplitter = {
      
    /*### CONFIG HERE ###*/
    
    APIuser: '0a1979f3449c0b9407b9720f340a2cc2',
    APIpw: '9254b73899d4c5f8e8ef80acad1c17a9',
    adminURL: 'https://zsys-zubair.myshopify.com/admin/',
    debug: false,
    
    view: document.getElementById('collSplitter_view'),
    submitB: document.getElementById('collSplitter_submit'),
    maxSize: document.getElementById('collSplitter_max'),
    pending: {},
  
    fetchJSON(url, post) {if(this.debug) {dbgLog('fetchJSON(' + url + ')' + (post ? (' post: ' + JSON.stringify(post)) : ''))}; return fetch(this.adminURL + url, {
      method: post ? 'POST' : 'GET',
      body: post ? JSON.stringify(post) : undefined,
      credentials: 'omit',
      headers: this.headers
    }).then(function(res) {return res.json();});},
    
    getCollections() {
      let that = this;
      return this.fetchJSON('custom_collections.json').then(function(res) {
        that.collections = res.custom_collections;
        that.view.innerHTML = '';
        for(let i of that.collections) {that.view.appendChild(that.mkCollectionEl(i));}
      });
    },
    
    mkCollectionEl(coll) {
      let el = document.createElement('div'),
      chkB = el.appendChild(document.createElement('input'))/*,
      delB = el.appendChild(document.createElement('button'))*/;
      el.className = 'shopifyCollection';
      chkB.c_id = /*delB.c_id =*/ coll.id;
      chkB.c_title = coll.title;
      chkB.type = 'checkbox';
      chkB.addEventListener('change', this.chkB_change);
      /*delB.innerText = 'delete';
      delB.addEventListener('click', this.delB_click);*/
      for(let i of ['title', 'handle', 'id']) {el.appendChild(document.createElement('span')).innerHTML = '<b>' + i + ': </b>' +coll[i];}
      return el;
    },
    
    splitColl(collId) {
      dbgLog('splitColl(' + collId + ')');
      let maxSize = this.maxSize.value;
      return this.fetchJSON('collects.json?collection_id=' + collId).then(res => {
        let items = res.collects, subItems, t = 0, splits = [];
        while((subItems = items.splice(0, maxSize)).length !== 0) {t++; splits.push(this.mkCollectionFrom(collId, subItems.map(this.extractProduct), t));}
        return Promise.all(splits);
      });
    },
    
    extractProduct(item) {return {product_id: item.product_id};},
    
    mkCollectionFrom(collId, items, count) {dbgLog(items); return this.fetchJSON('custom_collections.json', {
      custom_collection: {
        title: this.pending['c_' + collId] + '-' + count,
        collects: items
      }
    });},
    
    /*deleteColl(id) {return fetch(this.adminURL + 'custom_collections/#' + id + '.json', {
      method: 'DELETE',
      credentials: 'omit',
      headers: this.headers
    });},
    
    delB_click(ev) {
      ev.preventDefault();
      collSplitter.deleteColl(ev.target.c_id);
      return false;
    },*/
    
    chkB_change(ev) {collSplitter.updPending(ev.target);},
    
    updPending(chkB) {
      dbgLog('chkB_change');
      if(chkB.checked) {
        this.pending['c_' + chkB.c_id] = chkB.c_title;
        chkB.parentNode.style.borderColor = '#f00';
      } else {
        delete this.pending['c_' + chkB.c_id];
        chkB.parentNode.style.borderColor = '#222';
      }
      this.submitB.setAttribute('title', 'Split ' + Object.keys(this.pending).length + ' selected collections');
    },
    
    submitB_click(ev) {
      dbgLog('submitB_click');
      let tar = ev.target, splits = [];
      tar.disabled = true;
      tar.innerText = 'Splitting...';
      for(let i in collSplitter.pending) {splits.push(collSplitter.splitColl(i.slice(2)));}
      Promise.all(splits).then(function(ret) {
        dbgLog('done splitting: ' + ret);
        collSplitter.pending = {};
        collSplitter.getCollections();
        tar.innerText = 'Split selected';
        tar.disabled = false;
      });
    },
  
    init() {
      this.submitB.addEventListener('click', this.submitB_click);
      this.headers = {
        'Authorization': 'Basic ' + btoa(this.APIuser + ':' + this.APIpw),
        'Content-Type': 'application/json'
      };
      this.getCollections();
      dbgLog('collSplitter.init()');
      return this;
    }
    
  };
  
  if(collSplitter.debug) {window.Shopify_collSplitter = collSplitter;}
  return collSplitter.init();
  //window.addEventListener('load', function() {return collSplitter.init();}); // Too slow. Why wait for Shopify to load?
  
})();

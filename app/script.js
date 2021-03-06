const btnTab = document.getElementById('top-bar')
const tabContainer = document.getElementById('tab-container')
const fileUpload = document.getElementById('file-upload')
var packages = []
var package = null
var item = null

// ------------ UI FUNCTIONS ------------

function setTab(tabID) {
  [...btnTab.children].forEach(function(x,y){
    if (y == tabID+1)
      x.classList.add('active')
    else
      x.classList.remove('active')
  });
  [...tabContainer.children].forEach(function(x,y){
    if (y == tabID) {
      if (x.getAttribute('data-onTabbed'))
        eval(x.getAttribute('data-onTabbed'))
        //eval is bad, but I can't execute a string.
      x.classList.add('active')
    }
    else
      x.classList.remove('active')
  })
}

function updateButtonsAvailable() {
  //.filter(function(x){return x.nodeName == 'BUTTON'})
  [...$('button')].forEach((btn)=>{
    if (btn.getAttribute('data-required'))
      btn.disabled = !eval(btn.getAttribute('data-required'))
  })
}

// ------------ TEMPORARY DEFINITIONS ------------

async function loadPackageList() {
  packages = await eel.loadPackageList()()
  return packages
}

function savePackage() { // package.filename is overwritten every time the package is loaded
  eel.savePackage(package,package.filename)()
}

// ------------ TAB SETUP EVENTS ------------

// TAB 0

async function tab0_browser_setup() {
  const pkgBrowserElement = document.getElementById('tab0-package-browser')
  pkgBrowserElement.innerHTML = ''
  await loadPackageList()
  for (let pkgRAW in packages) {
    let pkg = (packages[pkgRAW])
    pkgBrowserElement.innerHTML += `<li data-pkgid="${pkg.id}" onclick="tab0_set_active_package(this)">${pkg.title}<span class="tab0-filename">${pkg.filename}</span></li>`
  }
}

function tab0_browser_reset() {
  package = null
  item = null
  tab0_browser_setup()
  updateButtonsAvailable()
}

function tab0_set_active_package(e) {
  const packageEls = [...$('#tab0-package-browser li.active')]
  if (packageEls.length)
    packageEls[0].classList.remove('active')
  e.classList.add('active')
  package = packages.filter((x)=>{return x.id == e.getAttribute('data-pkgid')})[0]
  tab1_load_data()
  updateButtonsAvailable()
}

function createPackage() {
  const newPackage = {
    'title':'New package',
    'description':'A new package.',
    'id':'NEW_PACKAGE',
    'items':[]
  }
  let fname = prompt('Filename')
  if (!fname.length) {
    alert('Operation aborted.')
    return
  }
  eel.savePackage(newPackage,fname+'.ucp')()
  tab0_browser_reset()
}

function deletePackage() {
  if (confirm(`Are you sure you want to delete "${package.title}"?`))
    eel.deleteFile(package.filename)()
    tab0_browser_reset()
}

function pickImage() {
  let picker = $('#image-picker')[0]
  picker.click()
  return picker.value
}

// TAB 1

function tab1_load_data() {
  // fill in forms
  [...$('#tab-package input')].forEach((el)=>{
    if (el.getAttribute('data-packagedata'))
      el.value = eval(el.getAttribute('data-packagedata'))
      // Yes, yes. Eval is terrible. I don't know how to do it otherwise.
  })
  // item list
  let itemlist = $('#item-list ul')[0]
  itemlist.innerHTML = ''
  Object.keys(package.items).forEach((itmRAW)=>{
    let itm = package.items[itmRAW]
    itemlist.innerHTML += `<li data-itemid="${itm.id}" onclick="tab1_set_active_item(this)">${itm.title}<img src="#" style="float: right;"></li>`
  })
  item = null
}

function savePackageAttributes() {
  [...$('#tab-package input')].forEach((el)=>{
    if (el.getAttribute('data-packagedata'))
      eval(el.getAttribute('data-packagedata')+' = el.value')
      // jesus fucking christ this is an abomination
  })
  savePackage()
}

function tab1_set_active_item(e) {
  const itemEls = [...$('#item-list li.active')]
  if (itemEls.length)
    itemEls[0].classList.remove('active')
  e.classList.add('active')
  item = package.items.filter((x)=>{return x.id == e.getAttribute('data-itemid')})[0]
  updateButtonsAvailable()
}

function createItem() {
    package.items.push({
      'id':'NEW_ITEM',
      'title':'New Item',
      'description':'A new item.',
      'picker':'none',
      'placement':[0,0,0],
      'handle':'none',
      'instances':['','','','','',''],
      'embed':{'enable':0,'area':[0,0,0,0,0,0]}
    })
    tab1_load_data()
    updateButtonsAvailable()
    savePackage()
}

function deleteCurrentItem() {
  if (confirm(`Are you sure you want to delete the item "${item.id}"`)) {

    package.items = package.items.filter((x)=>{return x.id != item.id})
    tab1_load_data()
    updateButtonsAvailable()
    savePackage()
  }
}

// TAB 2

function tab2_load_data() {
  // fill in forms
  [...$('#tab-item input')].forEach((el)=>{
    if (el.getAttribute('data-itemdata') && el.type != "file") {
      if (el.type == "checkbox")
        el.checked = eval(el.getAttribute('data-itemdata'))
      else
        el.value = eval(el.getAttribute('data-itemdata'))
    }
      // Yes, yes. Eval is terrible. I don't know how to do it otherwise. (2)
  })
  tab2_refresh_found_instances()
  // update Instances

}

function tab2_refresh_found_instances() {
  item.instances.map(async (inst,ind)=>{
    console.log("Testing for file",`assets/instances/${item.id}/${ind}.vmf`)
    let tmp = await eel.assetExists(package.filename,`assets/instances/${item.id}/${ind}.vmf`)()
    return tmp
  });
  console.log(item.instances);
  [...$('#tab2-item-instances fieldset a')].forEach((el) => {
    if (el.getAttribute('data-instance-id')) {
      if (item.instances[el.getAttribute('data-instance-id')])
        el.classList.add('picked')
      else {
        el.classList.remove('picked')
      }
    }
  })
}

function saveCurrentItem() {
  [...$('#tab-item input, #tab-item select')].forEach((el)=>{
    if (el.getAttribute('data-itemdata'))
      if (!el.getAttribute('data-tab2-dropdown') || el.getAttribute('data-tab2-dropdown') == item.picker)
      if (el.type == "checkbox")
        eval(el.getAttribute('data-itemdata')+' = el.checked')
      else
        eval(el.getAttribute('data-itemdata')+' = el.value')
      // jesus fucking christ this is an abomination (2)
  })
  package.items.filter((x)=>{x.id == item.id})[0] = item
  console.log(package.items)
  savePackage()
}

function tab2_setpickertype(e) {
  [...$('#tab2-item-instances fieldset')].forEach((x)=>{
    x.classList.remove('tab2-fieldset-enabled')
    if (x.getAttribute('data-pickertype') == e)
      x.classList.add('tab2-fieldset-enabled')
  })
}

async function setItemIcon() {
  let b64 = await eel.requestImageToSave(package.filename,'Pick an item icon.', (("PNG","*.png")),`assets/items/${item.id}.png`)()
  if (b64 === undefined)
    return
  console.log('Set item icon.')
  $('#item-icon')[0].src = b64
}

async function tab2_setItemInstance(id) {
  let tmp = await eel.requestVMF(package.filename,`assets/instances/${item.id}/${id}.vmf`,"Selecting instance #"+id)()
  if (tmp) {
    item.instances[id] = 1
    tab2_refresh_found_instances()
  }
}

// TAB 3

function exportPackage() {
  eel.exportPackage(package)
}

//$('#tab-package-browser ul li').on('click',(x)=>{console.log(x.getAttribute('filename'))})



// APP LAUNCH EVENTS

tab0_browser_reset()

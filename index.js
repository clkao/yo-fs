var relative = require('relative-date')
var pretty = require('prettier-bytes')
var path = require('path')
var data = require('render-data')
var yo = require('yo-yo')

module.exports = Tree

function Tree (root, entries, onclick) {
  if (!(this instanceof Tree)) return new Tree(root, entries, onclick)
  this.widget = this.render(root, entries, onclick)
}

Tree.prototype.update = function (fresh) {
  var self = this
  yo.update(self.widget, fresh)
}

Tree.prototype.render = function (root, entries, onclick) {
  var self = this
  var visible = []
  var roots = split(root)
  entries.forEach(function (entry) {
    var paths = split(entry.name)
    if (paths.length === (roots.length + 1)) {
      var isChild = true
      for (var i = 0; i < roots.length && isChild === true; i++) {
        isChild = (paths[i] === roots[i])
      }
      if (isChild === true) visible.push(entry)
    }
  })
  var displayId = 'display'
  var display = yo`<div id="${displayId}"></div>`
  var fs = yo`<div id="fs">
    <ul id="file-widget">
      ${backRow()}
      ${visible.map(function (entry) {
        return row(entry)
      })}
    </ul>
  </div>`

  var widget = yo`<div id="yo-fs">
    ${fs}
    ${display}
  </div>`

  return widget

  function backButton (ev) {
    var entry = {
      name: path.dirname(root),
      type: 'directory'
    }
    onclick(ev, entry)
    self.update(self.render(entry.name, entries, onclick))
  }

  function backRow () {
    if (root === '/' || root === '' || root === '.') return
    return yo`<li class='entry-back' onclick=${backButton}>
      <a href='javascript:void(0)'>
        <span class="name">..</span>
      </a>
    </li>`
  }

  function row (entry) {
    function click (e) {
      onclick(e, entry)
      var displayElem = document.getElementById(displayId)
      if (entry.type === 'directory') {
        displayElem.innerHTML = ''
        self.update(self.render(entry.name, entries, onclick))
      }
      if (entry.type === 'file') {
        data.render({
          name: entry.name,
          createReadStream: entry.createReadStream
        }, displayElem, function (err) {
          if (err) {
            var ext = path.extname(entry.name)
            displayElem.innerHTML = '<div class="render-error">Can not display ' + ext + ' files.</div>'
          }
        })
      }
    }
    return yo`<li class='entry ${entry.type}' onclick=${click}>
      <a href="javascript:void(0)">
        <span class="name">${path.basename(entry.name)}</span>
        <span class="modified">${entry.mtime ? relative(entry.mtime) : ''}</span>
        <span class="size">${pretty(entry.length)}</span>
      </a>
    </li>`
  }
}

function split (pathName) {
  var fileArray = pathName.split('/')
  while (fileArray[0] === '' || fileArray[0] === '.') {
    fileArray.shift() // remove empty items from the beginning
  }
  while (fileArray[fileArray.length - 1] === '') {
    fileArray.pop() // remove empty items from the end
  }
  return fileArray
}

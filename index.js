/* global makeSznSelectBundleScript */

import React from 'react'
import PropTypes from 'prop-types'

const e = React.createElement
const READY_EVENT = 'szn-select:ready'
const UI_CONTAINER_PROPS = {'data-szn-select--ui': ''}

const DEFAULT_LOADER_OPTIONS = {
  enable: true,
  useEmbeddedLoader: false,
  useAsyncLoading: true,
  urls: {
    package: 'https://unpkg.com/@jurca/szn-select@<VERSION>/',
  },
}

// No need to specify every supported prop, any other prop is validated by the <select> element anyway
const PROP_TYPES = {
  id: PropTypes.string,
  name: PropTypes.string,
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  onChange: PropTypes.func,

  loaderOptions: PropTypes.shape({
    enable: PropTypes.bool,
    useEmbeddedLoader: PropTypes.bool,
    useAsyncLoading: PropTypes.bool,
    urls: PropTypes.shape({
      'package': PropTypes.string,
      'loader': PropTypes.string,
      'es3': PropTypes.string,
      'es2016': PropTypes.string,
      'bundle-elements.es3': PropTypes.string,
      'bundle-elements.es2016': PropTypes.string,
      'bundle-full.es3': PropTypes.string,
      'bundle-full.es2016': PropTypes.string,
      'bundle-full.ce': PropTypes.string,
    }),
  }),

  children: PropTypes.node,
}

let sznSelectLoadingBegun = false

export default class SznSelect extends React.Component {
  static get propTypes() {
    return PROP_TYPES
  }

  constructor(props) {
    super(props)

    this._previousRootNode = null
    this._uiContainer = e('span', UI_CONTAINER_PROPS) // we don't want the UI container updated
    this._onRootNodeUpdate = this.onRootNodeUpdate.bind(this)
    this._onSelectReady = this.onSelectReady.bind(this)

    this.state = {
      sznSelectProps: {
        ref: this._onRootNodeUpdate,
      },
    }
  }

  render() {
    let selectProps = this.props
    if (selectProps.loaderOptions) {
      // The "rest object properties" syntax is not supported by babel-present-env at the moment
      selectProps = Object.assign({}, selectProps)
      delete selectProps.loaderOptions
    }

    return e('szn-select', this.state.sznSelectProps,
      e('select', selectProps,
        selectProps.children,
      ),
      this._uiContainer,
    )
  }

  componentDidMount() {
    if (sznSelectLoadingBegun) {
      return
    }

    sznSelectLoadingBegun = true
    if (
      self.SznElements &&
      self.SznElements.init &&
      self.SznElements['szn-tethered'] &&
      self.SznElements['szn-select']
    ) {
      return
    }

    const loaderOptions = this.props.loaderOptions || DEFAULT_LOADER_OPTIONS
    if (loaderOptions.enable === false) {
      return
    }

    if (loaderOptions.useEmbeddedLoader) {
      const urlsConfiguration = loaderOptions.urls || DEFAULT_LOADER_OPTIONS.urls
      const bundleScript = loadSznSelect(urlsConfiguration, loaderOptions.useAsyncLoading !== false)
      document.head.appendChild(bundleScript)
      return
    }

    const loaderScript = document.createElement('script')
    loaderScript.async = loaderOptions.useAsyncLoading !== false

    const urls = loaderOptions.urls || {}
    const providedPackageUrl = urls.package || DEFAULT_LOADER_OPTIONS.urls.package
    const packageUrl = /\/$/.test(providedPackageUrl) ? providedPackageUrl : `${providedPackageUrl}/`

    loaderScript.setAttribute('data-szn-select--loader-urls--package', packageUrl)
    for (const urlOption of Object.keys(urls)) {
      loaderScript.setAttribute(`data-szn-select--loader-urls--${urlOption.replace('.', '-')}`, urls[urlOption])
    }

    loaderScript.src = urls.loader || `${packageUrl}loader.min.js`

    document.head.appendChild(loaderScript)
  }

  onRootNodeUpdate(rootNode) {
    if (rootNode === this._previousRootNode) {
      return
    }

    if (this._previousRootNode) {
      this._previousRootNode.removeEventListener(READY_EVENT, this._onSelectReady)
    }

    this._previousRootNode = rootNode
    if (rootNode) {
      rootNode.addEventListener(READY_EVENT, this._onSelectReady)
      if (rootNode.isReady && rootNode.requestedAttributes) {
        this._handleAttributesUpdate(rootNode.requestedAttributes)
      }
    }
  }

  onSelectReady(event) {
    this._handleAttributesUpdate(event.detail.attributes)
  }

  _handleAttributesUpdate(requestedAttributeUpdate) {
    const sznSelectProps = this._processAttributes(requestedAttributeUpdate)
    sznSelectProps.ref = this._onRootNodeUpdate
    this.setState({
      sznSelectProps,
    })
  }

  _processAttributes(attributesUpdate) {
    const currentAttributes = {}
    for (const attribute of Object.keys(attributesUpdate)) {
      if (attributesUpdate[attribute] !== null) { // attribute deleting is handled by React
        currentAttributes[attribute] = attributesUpdate[attribute]
      }
    }
    return currentAttributes
  }
}

function loadSznSelect(urlConfiguration, useAsyncLoading) {
  // %{EMBEDDABLE_LOADER}%

  return makeSznSelectBundleScript(urlConfiguration, useAsyncLoading)
}

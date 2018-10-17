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
  defaultValue: PropTypes.string,
  value: PropTypes.string,
  dropdownClassName: PropTypes.string,
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
    this._nativeSelect = null
    this._uiContainer = e('span', UI_CONTAINER_PROPS) // we don't want the UI container updated
    this._onRootNodeUpdate = this.onRootNodeUpdate.bind(this)
    this._onNativeSelectNodeUpdate = this.onNativeSelectNodeUpdate.bind(this)
    this._onSelectReady = this.onSelectReady.bind(this)
    this._initCallbackDelayedExecutionId = null

    this.state = {
      sznSelectProps: {
        'data-szn-elements--init-on-demand': '',
        'ref': this._onRootNodeUpdate,
      },
    }
  }

  render() {
    // The "rest object properties" syntax is not supported by babel-present-env at the moment
    const selectProps = Object.assign({
      ref: this._onNativeSelectNodeUpdate,
    }, this.props)
    if (selectProps.loaderOptions) {
      delete selectProps.loaderOptions
    }
    if (selectProps.hasOwnProperty('dropdownClassName')) {
      delete selectProps.dropdownClassName
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

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value && this._nativeSelect) {
      // Let the szn-select know that the value, managed by React, has changed, so the UI can get updated.
      this._nativeSelect.dispatchEvent(new CustomEvent('change'))
    }
    if (prevProps.dropdownClassName !== this.props.dropdownClassName && this._previousRootNode._broker) {
      this._previousRootNode.dropdownClassName = this.props.dropdownClassName
    }
  }

  onRootNodeUpdate(rootNode) {
    if (rootNode === this._previousRootNode) {
      return
    }

    if (this._previousRootNode) {
      this._previousRootNode.removeEventListener(READY_EVENT, this._onSelectReady)
      if (this._previousRootNode._broker) {
        this._previousRootNode._broker.onUnmount() // no check needed, szn-select relies on the onUnmount callback
      }
      if (this._initCallbackDelayedExecutionId) {
        cancelAnimationFrame(this._initCallbackDelayedExecutionId)
        this._initCallbackDelayedExecutionId = null
      }
    }

    this._previousRootNode = rootNode
    if (rootNode) {
      this._awaitAndFinalizeInitialization(rootNode)
      rootNode.addEventListener(READY_EVENT, this._onSelectReady)
      if (rootNode.isReady && rootNode.requestedAttributes) {
        this._handleAttributesUpdate(rootNode.requestedAttributes)
      }
    }
  }

  onNativeSelectNodeUpdate(nativeSelect) {
    this._nativeSelect = nativeSelect
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

  _awaitAndFinalizeInitialization(sznSelectNode) {
    const readyCheckCallback = () => {
      if (sznSelectNode._broker) {
        sznSelectNode._broker.onMount() // no check needed, szn-select relies on the onMount callback
        sznSelectNode.dropdownClassName = this.props.dropdownClassName || ''
      } else {
        this._initCallbackDelayedExecutionId = requestAnimationFrame(readyCheckCallback)
      }
    }

    // Run immediately in case we're already initialized, which is always the case with a pre-loaded custom elements
    // runtime.
    readyCheckCallback()
  }
}

function loadSznSelect(urlConfiguration, useAsyncLoading) {
  // %{EMBEDDABLE_LOADER}%

  return makeSznSelectBundleScript(urlConfiguration, useAsyncLoading)
}

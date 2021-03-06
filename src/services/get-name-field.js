// @flow
import type {GLStyle} from '../types/mapbox-gl-style'
import MapStyles from '../components/Map/Styles'
import _find from 'lodash.find'

module.exports = {

  possibleNameFields: ['name', 'nom', 'nombre', 'nome'],

  getNamFieldFromPresets (presets: Array<Object>) {
    const nameFieldPreset = _find(presets, {isName: true})
    let nameField
    if (nameFieldPreset) {
      nameField = nameFieldPreset.tag
    }
    return nameField
  },

  guessNameFieldFromProps (properties: Object) {
    let nameField
    const _this = this
    Object.keys(properties).forEach(key => {
      const lowercaseKey = key.toLowerCase()
      if (!nameField) {
        _this.possibleNameFields.forEach(name => {
          if (lowercaseKey.includes(name)) {
            nameField = key
          }
        })
      }
    })
    return nameField
  },

  getPresetsFromStyle (style?: GLStyle) {
    if (style) {
      const firstSource = Object.keys(style.sources)[0]
      if (firstSource) {
        return MapStyles.settings.getSourceSetting(style, firstSource, 'presets')
      }
    }
  },

  getNameField (properties: Object, presets?: Array<Object>) {
    let nameField
    if (presets) {
      nameField = this.getNamFieldFromPresets(presets)
    }
    if (!nameField) {
      nameField = this.guessNameFieldFromProps(properties)
    }
    return nameField
  }
}

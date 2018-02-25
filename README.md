# szn-select-react

[![npm](http://img.shields.io/npm/v/@jurca/szn-select-react.svg)](https://www.npmjs.com/package/@jurca/szn-select-react)
[![License](https://img.shields.io/npm/l/@jurca/szn-select-react.svg)](https://github.com/jurca/szn-select-react/blob/master/LICENSE)

Accessible HTML `<select>` element replacement with customizable UI. This
package provides integration of the
[szn-select](https://github.com/jurca/szn-select) project for React projects.

## Usage

First install the package:

```
npm install --save @jurca/szn-select-react
``` 

The `<szn-select>` (as the `SznSelect` component) element can be then used the
same way as you would use a `<select>` element in your project. The following
example shows various usage options:

```jsx harmony
import React from 'react'
import SznSelect from '@jurca/szn-select-react'

export default props =>
  <form action='/submit-form' method='post'>
    <div className='inline-form'>
      <label htmlFor='mySelect'>
        Choose one
      </label>
      {/* use the <SznSelect> component as if if was an ordinary <select> element */}
      <SznSelect name='singleOption' id='mySelect' onChange={props.onFirstChanged}>
        <option value='1'>first</option>
        <option value='2' selected>second</option>
        <optgroup label='this is a group'>
          <option value='3'>option groups are supported as well</option>
        </optgroup>
      </SznSelect>
    </div>
    <div className='inline-form'>
      <label htmlFor='anotherSelect'>
        Choose any
      </label>
      <SznSelect name='manyOptions' id='anotherSelect' multiple>
        <option value='foo'>foo</option>
        <option value='foo' title='multiple options may have the same value'>foo 2</option>
        <option value='bar' selected>bar</option>
        <option value='baz' disabled>baz</option>
      </SznSelect>
    </div>
  </form>
```

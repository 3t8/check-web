import React from 'react';
import { IntlProvider } from 'react-intl';
import { mountWithIntl } from './helpers/intl-test';
import { expect } from 'chai';
import CreateTeamTask from '../../src/app/components/team/CreateTeamTaskModern';

describe('<CreateTeamTask />', () => {
  it('should render create task button', function() {
    const wrapper = mountWithIntl(
      <CreateTeamTask />
    );
    expect(wrapper.find('.create-task__add-button').hostNodes()).to.have.length(1);
  });
});

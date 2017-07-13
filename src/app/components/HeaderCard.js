import React, { Component } from 'react';
import IconButton from 'material-ui/IconButton';
import MDEdit from 'react-icons/lib/md/edit';
import { Card } from 'material-ui/Card';
import styled from 'styled-components';
import { FormattedMessage, injectIntl } from 'react-intl';
import Can from './Can';
import { units, unitless, black54, boxShadow, black87 } from '../styles/js/variables';

class HeaderCard extends Component {
  render() {
    // Define variables for styles
    const teamProfileOffset = unitless(18);
    const teamProfileBottomPad = unitless(8);
    const teamProfileFabHeight = unitless(5);

    // TODO — Use styled components instead of the cardHeaderStyle object.
    // For an unknown reason, using CardHeader makes nested TextFields stop working
    // (somehow styled-components seems to be breaking handleChange in the parent in TeamComponent.)
    // To reproduce this break, replace <Card style={cardHeaderStyle}> component with <CardHeader>.
    // Then try to edit the Team form.
    // - CGB 2017-7-12
    //
    // const CardHeader = styled(Card)`
    //   margin-bottom: ${units(6)};
    //   margin-top: -${teamProfileOffset}px;
    //   padding-bottom: ${teamProfileBottomPad}px;
    //   padding-top: ${teamProfileOffset}px;
    // `;

    const cardHeaderStyle = {
      marginBottom: units(6),
      marginTop: `-${teamProfileOffset}`,
      paddingBottom: teamProfileBottomPad,
      paddingTop: teamProfileOffset,
    };

    //  IconButton with tooltip
    const TooltipButton = styled(IconButton)`
      box-shadow: ${boxShadow(2)};
      background-color: white !important;
      border-radius: 50% !important;
      position: absolute !important;
      ${this.props.direction.to}: 80px !important;
      bottom: -${(teamProfileFabHeight * 0.5) + teamProfileBottomPad}px;

      &:hover {
        box-shadow: ${boxShadow(4)};

        svg {
          fill: ${black87} !important;
        }
      }

      svg {
        fill: ${black54} !important;
        font-size: 20px;
      }
    `;

    return (
      <Card style={cardHeaderStyle}>
        <div>{this.props.children}</div>
        <section style={{ position: 'relative' }}>
          {this.props.isEditing === false
            ? <Can permissions={this.props.teamPermissions} permission="update Team">
              <TooltipButton
                className="team__edit-button"
                tooltip={
                  <FormattedMessage id="teamComponent.editButton" defaultMessage="Edit profile" />
                  }
                tooltipPosition="top-center"
                onTouchTap={this.props.handleEnterEditMode}
              >
                <MDEdit />
              </TooltipButton>
            </Can>
            : null}
        </section>
      </Card>
    );
  }
}

export default injectIntl(HeaderCard);

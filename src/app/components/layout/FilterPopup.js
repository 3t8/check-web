import React from 'react';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import FilterListIcon from '@material-ui/icons/FilterList';
import styled from 'styled-components';
import { units, Row } from '../../styles/js/shared';

const messages = defineMessages({
  search: {
    id: 'MultiSelector.search',
    defaultMessage: 'Search...',
  },
});

const StyledPaper = styled(Paper)`
  padding: ${units(2)};
`;

class FilterPopup extends React.Component {
  state = {
    popper: {
      open: false,
    },
  };

  handleMenuClick = (event) => {
    const popperOpen = !this.state.popper.open;
    const popper = { open: popperOpen, anchorEl: event.currentTarget };
    this.setState({ popper });
  };

  handleClose = () => {
    this.setState({ popper: { open: false } });
  };

  render() {
    const { formatMessage } = this.props.intl;
    return (
      <div>
        <Row>
          { this.props.tooltip ?
            <Tooltip title={this.props.tooltip}>
              <IconButton onClick={this.handleMenuClick}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            :
            <IconButton onClick={this.handleMenuClick}>
              <FilterListIcon />
            </IconButton>
          }
          { this.props.label ? this.props.label : null }
        </Row>
        <Popper
          open={this.state.popper.open}
          anchorEl={this.state.popper.anchorEl}
          placement="bottom-start"
        >
          <StyledPaper>
            { this.props.onSearchChange ?
              <TextField
                defaultValue={this.props.search}
                onChange={this.props.onSearchChange}
                placeholder={formatMessage(messages.search)}
              />
              : null
            }
            {this.props.children}
            <Button onClick={this.handleClose} style={{ marginTop: units(2) }}>
              <FormattedMessage id="FilterPopup.close" defaultMessage="Done" />
            </Button>
          </StyledPaper>
        </Popper>
      </div>
    );
  }
}

export default injectIntl(FilterPopup);

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Relay from 'react-relay/classic';
import { injectIntl, FormattedMessage, defineMessages } from 'react-intl';
import { Link } from 'react-router';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import MediaStatus from './MediaStatus';
import MediaRoute from '../../relay/MediaRoute';
import MediaActions from './MediaActions';
import Attribution from '../task/Attribution';
import CreateProjectMediaProjectMutation from '../../relay/mutations/CreateProjectMediaProjectMutation';
import UpdateProjectMediaMutation from '../../relay/mutations/UpdateProjectMediaMutation';
import DeleteProjectMediaProjectMutation from '../../relay/mutations/DeleteProjectMediaProjectMutation';
import UpdateStatusMutation from '../../relay/mutations/UpdateStatusMutation';
import MoveDialog from './MoveDialog';
import CheckContext from '../../CheckContext';
import globalStrings from '../../globalStrings';
import { stringHelper } from '../../customHelpers';
import { nested, getErrorMessage } from '../../helpers';

const messages = defineMessages({
  mediaTitle: {
    id: 'mediaDetail.mediaTitle',
    defaultMessage: 'Title',
  },
  mediaDescription: {
    id: 'mediaDetail.mediaDescription',
    defaultMessage: 'Description',
  },
  editReport: {
    id: 'mediaDetail.editReport',
    defaultMessage: 'Edit',
  },
  editReportError: {
    id: 'mediaDetail.editReportError',
    defaultMessage: 'Sorry, an error occurred while updating the item. Please try again and contact {supportEmail} if the condition persists.',
  },
  trash: {
    id: 'mediaDetail.trash',
    defaultMessage: 'Trash',
  },
});

class MediaActionsBarComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      openAddToListDialog: false,
      openMoveDialog: false,
      openAssignDialog: false,
      dstProj: null,
      isEditing: false,
      title: null,
      description: null,
    };
  }

  getContext() {
    return new CheckContext(this).getContextStore();
  }

  getDescription() {
    return (typeof this.state.description === 'string') ? this.state.description.trim() : this.props.media.description;
  }

  getTitle() {
    return (typeof this.state.title === 'string') ? this.state.title.trim() : this.props.media.title;
  }

  currentProject() {
    return this.props.media.project;
  }

  handleAddToList() {
    this.setState({ openAddToListDialog: true });
  }

  handleAddItemToList() {
    const onSuccess = (response) => {
      const { project } = response.createProjectMediaProject;
      const message = (
        <FormattedMessage
          id="mediaMetadata.addedToList"
          defaultMessage="Added to list {listName}"
          values={{
            listName: (
              <Link to={`/${project.team.slug}/project/${project.dbid}`}>
                {project.title}
              </Link>
            ),
          }}
        />
      );
      this.context.setMessage(message);
    };

    const context = this.getContext();

    Relay.Store.commitUpdate(
      new CreateProjectMediaProjectMutation({
        project: this.state.dstProj,
        project_media: this.props.media,
        context,
      }),
      { onSuccess, onFailure: this.fail },
    );

    this.setState({ openAddToListDialog: false });
  }

  handleMove() {
    this.setState({ openMoveDialog: true });
  }

  fail(transaction) {
    const fallbackMessage = this.props.intl.formatMessage(globalStrings.unknownError, { supportEmail: stringHelper('SUPPORT_EMAIL') });
    const message = getErrorMessage(transaction, fallbackMessage);
    this.context.setMessage(message);
  }

  handleMoveProjectMedia() {
    const { media } = this.props;
    const { dstProj: { dbid: projectId } } = this.state;
    const { history } = this.getContext();

    const onFailure = (transaction) => {
      this.fail(transaction);
    };

    const path = `/${media.team.slug}/project/${projectId}`;
    const context = this.getContext();

    const onSuccess = () => {
      history.push(path);
    };

    Relay.Store.commitUpdate(
      new UpdateProjectMediaMutation({
        project_id: projectId,
        id: media.id,
        srcProj: this.currentProject(),
        dstProj: this.state.dstProj,
        context,
      }),
      { onSuccess, onFailure },
    );

    this.setState({ openMoveDialog: false });
  }

  handleRemoveFromList() {
    const context = this.getContext();
    const { media } = this.props;

    const onSuccess = () => {
      const message = (
        <FormattedMessage
          id="mediaActionsBar.removedFromList"
          defaultMessage="Removed from list"
        />
      );
      this.context.setMessage(message);
      const path = `/${media.team.slug}/media/${media.dbid}`;
      context.history.push(path);
    };

    Relay.Store.commitUpdate(
      new DeleteProjectMediaProjectMutation({
        project: media.project,
        project_media: media,
        context,
      }),
      { onSuccess, onFailure: this.fail },
    );
  }

  canSubmit = () => {
    const { title, description } = this.state;
    const permissions = JSON.parse(this.props.media.permissions);
    return (permissions['update Dynamic'] !== false && (typeof title === 'string' || typeof description === 'string'));
  };

  handleChangeTitle(e) {
    this.setState({ title: e.target.value });
  }

  handleChangeDescription(e) {
    this.setState({ description: e.target.value });
  }

  handleSave(media, event) {
    if (event) {
      event.preventDefault();
    }

    const embed = {};

    const { title, description } = this.state;

    if (typeof title === 'string') {
      embed.title = title.trim();
    }

    if (typeof description === 'string') {
      embed.description = description.trim();
    }

    if (embed.title === '' && media.media.embed_path) {
      embed.title = media.media.embed_path.split('/').pop().replace('embed_', '');
    }

    const onFailure = (transaction) => {
      const fallbackMessage = this.props.intl.formatMessage(messages.editReportError, { supportEmail: stringHelper('SUPPORT_EMAIL') });
      const message = getErrorMessage(transaction, fallbackMessage);
      this.context.setMessage(message);
    };

    if (this.canSubmit()) {
      Relay.Store.commitUpdate(
        new UpdateProjectMediaMutation({
          media,
          metadata: JSON.stringify(embed),
          id: media.id,
        }),
        { onFailure },
      );
    }

    this.handleCancel();
  }

  handleSendToTrash() {
    const onSuccess = (response) => {
      const pm = response.updateProjectMedia.project_media;
      const message = (
        <FormattedMessage
          id="mediaActionsBar.movedToTrash"
          defaultMessage="Sent to {trash}"
          values={{
            trash: (
              <Link to={`/${pm.team.slug}/trash`}>
                {this.props.intl.formatMessage(messages.trash)}
              </Link>
            ),
          }}
        />
      );
      this.context.setMessage(message);
    };

    const context = this.getContext();
    if (context.team && !context.team.public_team) {
      context.team.public_team = Object.assign({}, context.team);
    }

    Relay.Store.commitUpdate(
      new UpdateProjectMediaMutation({
        archived: 1,
        check_search_team: this.props.media.team.search,
        check_search_project: this.props.media.project ? this.props.media.project.search : null,
        check_search_trash: this.props.media.team.check_search_trash,
        media: this.props.media,
        context,
        id: this.props.media.id,
      }),
      { onSuccess, onFailure: this.fail },
    );
  }

  handleCancel() {
    this.setState({
      isEditing: false,
      title: null,
      description: null,
    });
  }

  handleCloseDialogs() {
    this.setState({
      isEditing: false,
      openAddToListDialog: false,
      openMoveDialog: false,
      openAssignDialog: false,
      dstProj: null,
    });
  }

  handleSelectDestProject(dstProj) {
    this.setState({ dstProj });
  }

  handleEdit() {
    this.setState({ isEditing: true });
  }

  handleRefresh() {
    Relay.Store.commitUpdate(
      new UpdateProjectMediaMutation({
        refresh_media: 1,
        id: this.props.media.id,
      }),
      { onFailure: this.fail },
    );
  }

  handleStatusLock() {
    const { media } = this.props;

    const statusAttr = {
      parent_type: 'project_media',
      annotated: media,
      annotation: {
        status_id: media.last_status_obj.id,
        locked: !media.last_status_obj.locked,
      },
    };

    Relay.Store.commitUpdate(
      new UpdateStatusMutation(statusAttr),
      { onFailure: this.fail },
    );
  }

  handleAssign() {
    this.setState({ openAssignDialog: true });
  }

  handleAssignProjectMedia() {
    const { media } = this.props;

    const onSuccess = () => {
      const message = (
        <FormattedMessage
          id="mediaActionsBar.assignmentsUpdated"
          defaultMessage="Assignments updated successfully!"
        />
      );
      this.context.setMessage(message);
    };

    const status_id = media.last_status_obj ? media.last_status_obj.id : '';

    const assignment = document.getElementById(`attribution-media-${media.dbid}`).value;

    const statusAttr = {
      parent_type: 'project_media',
      annotated: media,
      annotation: {
        status_id,
        assigned_to_ids: assignment,
      },
    };

    Relay.Store.commitUpdate(
      new UpdateStatusMutation(statusAttr),
      { onSuccess, onFailure: this.fail },
    );

    this.setState({ openAssignDialog: false });
  }

  handleRestore() {
    const onSuccess = (response) => {
      const pm = response.updateProjectMedia.project_media;
      const message = (
        <FormattedMessage
          id="mediaActionsBar.movedBack"
          defaultMessage="Restored to list {project}"
          values={{
            project: (
              <Link to={`/${pm.team.slug}/project/${pm.project_id}`}>
                {pm.project.title}
              </Link>
            ),
          }}
        />
      );
      this.context.setMessage(message);
    };

    const context = this.getContext();
    if (context.team && !context.team.public_team) {
      context.team.public_team = Object.assign({}, context.team);
    }

    Relay.Store.commitUpdate(
      new UpdateProjectMediaMutation({
        id: this.props.media.id,
        media: this.props.media,
        archived: 0,
        check_search_team: this.props.media.team.search,
        check_search_project: this.props.media.project.search,
        check_search_trash: this.props.media.team.check_search_trash,
        context,
      }),
      { onSuccess, onFailure: this.fail },
    );
  }

  render() {
    const { media, intl: { locale } } = this.props;
    const context = this.getContext();

    const addToListDialogActions = [
      <FlatButton
        label={
          <FormattedMessage
            id="mediaActionsBar.cancelButton"
            defaultMessage="Cancel"
          />
        }
        primary
        onClick={this.handleCloseDialogs.bind(this)}
      />,
      <FlatButton
        label={<FormattedMessage id="mediaActionsBar.add" defaultMessage="Add" />}
        primary
        className="media-actions-bar__add-button"
        keyboardFocused
        onClick={this.handleAddItemToList.bind(this)}
        disabled={!this.state.dstProj}
      />,
    ];

    const moveDialogActions = [
      <FlatButton
        label={
          <FormattedMessage
            id="mediaActionsBar.cancelButton"
            defaultMessage="Cancel"
          />
        }
        primary
        onClick={this.handleCloseDialogs.bind(this)}
      />,
      <FlatButton
        label={<FormattedMessage id="mediaActionsBar.move" defaultMessage="Move" />}
        primary
        className="media-actions-bar__move-button"
        keyboardFocused
        onClick={this.handleMoveProjectMedia.bind(this)}
        disabled={!this.state.dstProj}
      />,
    ];

    let smoochBotInstalled = false;
    if (media.team && media.team.team_bot_installations) {
      media.team.team_bot_installations.edges.forEach((edge) => {
        if (edge.node.team_bot.identifier === 'smooch') {
          smoochBotInstalled = true;
        }
      });
    }
    let isChild = false;
    let isParent = false;
    if (media.relationship) {
      if (media.relationship.target_id === media.dbid) {
        isChild = true;
      } else if (media.relationship.source_id === media.dbid) {
        isParent = true;
      }
    }
    const readonlyStatus = smoochBotInstalled && isChild && !isParent;

    const assignments = media.last_status_obj.assignments.edges;

    const assignDialogActions = [
      <FlatButton
        label={
          <FormattedMessage
            id="mediaActionsBar.cancelButton"
            defaultMessage="Cancel"
          />
        }
        primary
        onClick={this.handleCloseDialogs.bind(this)}
      />,
      <FlatButton
        label={<FormattedMessage id="mediaActionsBar.done" defaultMessage="Done" />}
        primary
        keyboardFocused
        onClick={this.handleAssignProjectMedia.bind(this)}
      />,
    ];

    const editDialog = (
      <Dialog
        modal
        title={this.props.intl.formatMessage(messages.editReport)}
        open={this.state.isEditing}
        onRequestClose={this.handleCloseDialogs.bind(this)}
        autoScrollBodyContent
      >
        <form onSubmit={this.handleSave.bind(this, media)} name="edit-media-form">
          <TextField
            type="text"
            id={`media-detail-title-input-${media.dbid}`}
            className="media-detail__title-input"
            floatingLabelText={this.props.intl.formatMessage(messages.mediaTitle)}
            defaultValue={this.getTitle()}
            onChange={this.handleChangeTitle.bind(this)}
            style={{ width: '100%' }}
          />

          <TextField
            type="text"
            id={`media-detail-description-input-${media.dbid}`}
            className="media-detail__description-input"
            floatingLabelText={this.props.intl.formatMessage(messages.mediaDescription)}
            defaultValue={this.getDescription()}
            onChange={this.handleChangeDescription.bind(this)}
            style={{ width: '100%' }}
            multiLine
          />
        </form>

        <span style={{ display: 'flex' }}>
          <FlatButton
            onClick={this.handleCancel.bind(this)}
            className="media-detail__cancel-edits"
            label={
              <FormattedMessage
                id="mediaDetail.cancelButton"
                defaultMessage="Cancel"
              />
            }
          />
          <FlatButton
            onClick={this.handleSave.bind(this, media)}
            className="media-detail__save-edits"
            label={
              <FormattedMessage
                id="mediaDetail.doneButton"
                defaultMessage="Done"
              />
            }
            disabled={!this.canSubmit()}
            primary
          />
        </span>
      </Dialog>
    );

    return (
      <div style={this.props.style} className={this.props.className}>
        { !media.archived ?
          <div>
            <RaisedButton
              label={
                <FormattedMessage
                  id="mediaActionsBar.addTo"
                  defaultMessage="Add to..."
                />
              }
              style={{
                margin: '0 8px',
              }}
              primary
              onClick={this.handleAddToList.bind(this)}
            />

            <RaisedButton
              label={
                <FormattedMessage
                  id="mediaActionsBar.moveTo"
                  defaultMessage="Move to..."
                />
              }
              style={{
                margin: '0 8px',
              }}
              primary
              onClick={this.handleMove.bind(this)}
            />

            { media.project_id ?
              <FlatButton
                label={
                  <FormattedMessage
                    id="mediaActionsBar.removeFromList"
                    defaultMessage="Remove from list"
                  />
                }
                style={{
                  margin: '0 8px',
                  border: '1px solid #000',
                }}
                onClick={this.handleRemoveFromList.bind(this)}
              /> : null }
          </div> : <div />}

        <div
          style={{
            display: 'flex',
          }}
        >
          <MediaStatus
            media={media}
            readonly={media.archived || media.last_status_obj.locked || readonlyStatus}
          />

          <MediaActions
            style={{
              height: 36,
              marginTop: -5,
            }}
            media={media}
            handleEdit={this.handleEdit.bind(this)}
            handleRefresh={this.handleRefresh.bind(this)}
            handleSendToTrash={this.handleSendToTrash.bind(this)}
            handleRestore={this.handleRestore.bind(this)}
            handleAssign={this.handleAssign.bind(this)}
            handleStatusLock={this.handleStatusLock.bind(this)}
            locale={locale}
          />
        </div>

        {this.state.isEditing ? editDialog : null}

        <MoveDialog
          actions={addToListDialogActions}
          open={this.state.openAddToListDialog}
          handleClose={this.handleCloseDialogs.bind(this)}
          team={context.team}
          projectId={media.project_ids}
          onChange={this.handleSelectDestProject.bind(this)}
          style={{
            minHeight: 400,
          }}
          title={
            <FormattedMessage
              id="mediaActionsBar.dialogAddToListTitle"
              defaultMessage="Add to a different list"
            />
          }
        />

        <MoveDialog
          actions={moveDialogActions}
          open={this.state.openMoveDialog}
          handleClose={this.handleCloseDialogs.bind(this)}
          team={context.team}
          projectId={nested(['project', 'dbid'], media)}
          onChange={this.handleSelectDestProject.bind(this)}
          style={{
            minHeight: 400,
          }}
          title={
            <FormattedMessage
              id="mediaActionsBar.dialogMoveTitle"
              defaultMessage="Move to a different list"
            />
          }
        />

        <Dialog
          actions={assignDialogActions}
          modal
          open={this.state.openAssignDialog}
          onRequestClose={this.handleCloseDialogs.bind(this)}
          autoScrollBodyContent
        >
          <h4 className="media-detail__dialog-header">
            <FormattedMessage
              id="mediaActionsBar.assignDialogHeader"
              defaultMessage="Assignment"
            />
          </h4>
          <Attribution
            multi
            selectedUsers={assignments}
            id={`media-${media.dbid}`}
          />
        </Dialog>
      </div>
    );
  }
}

MediaActionsBarComponent.contextTypes = {
  store: PropTypes.object,
  setMessage: PropTypes.func,
};

const MediaActionsBarContainer = Relay.createContainer(MediaActionsBarComponent, {
  initialVariables: {
    contextId: null,
  },
  fragments: {
    media: () => Relay.QL`
      fragment on ProjectMedia {
        id
        dbid
        project_id
        project_ids
        title
        demand
        description
        permissions
        verification_statuses
        metadata
        overridden
        url
        quote
        archived
        media {
          url
          embed_path
          metadata
        }
        targets_by_users(first: 50) {
          edges {
            node {
              id
              dbid
              last_status
            }
          }
        }
        last_status
        last_status_obj {
          id
          dbid
          locked
          content
          assignments(first: 10000) {
            edges {
              node {
                id
                dbid
                name
              }
            }
          }
        }
        relationship {
          id
          dbid
          target_id
          source_id
        }
        project {
          id
          dbid
          title
          search_id
          medias_count
          search {
            id
            number_of_results
          }
        }
        team {
          id
          dbid
          slug
          medias_count
          trash_count
          public_team {
            id
          }
          search {
            id
            number_of_results
          }
          check_search_trash {
            id
            number_of_results
          }
          team_bot_installations(first: 10000) {
            edges {
              node {
                id
                team_bot: bot_user {
                  id
                  identifier
                }
              }
            }
          }
        }
      }
    `,
  },
});

// eslint-disable-next-line react/no-multi-comp
class MediaActionsBar extends React.PureComponent {
  render() {
    const { props } = this;
    const projectId = props.params.projectId || 0;
    const ids = `${props.params.mediaId},${projectId}`;
    const route = new MediaRoute({ ids });

    return (
      <Relay.RootContainer
        Component={MediaActionsBarContainer}
        renderFetched={data => <MediaActionsBarContainer {...this.props} {...data} />}
        route={route}
      />
    );
  }
}

export default injectIntl(MediaActionsBar);
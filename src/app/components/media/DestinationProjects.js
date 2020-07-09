import React from 'react';
import PropTypes from 'prop-types';
import { createFragmentContainer, graphql } from 'react-relay/compat';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import { FormattedMessage } from 'react-intl';

function DestinationProjects({
  team, excludeProjectDbids, value, onChange,
}) {
  const filteredProjects = team.projects.edges
    .map(({ node }) => node)
    .filter(({ dbid }) => !excludeProjectDbids.includes(dbid));

  const handleChange = React.useCallback((ev, newValue, reason) => {
    switch (reason) {
    case 'select-option': onChange(newValue); break;
    case 'clear': onChange(null); break;
    default: break;
    }
  }, [onChange]);

  // autoHighlight: makes it so user can type name and press Enter to choose list
  return (
    <Autocomplete
      options={filteredProjects}
      autoHighlight
      value={value}
      onChange={handleChange}
      getOptionLabel={({ title }) => title}
      groupBy={() => team.name /* show team name on top of all options */}
      renderInput={params => (
        <TextField
          {...params}
          autoFocus
          name="project-title"
          label={
            <FormattedMessage id="destinationProjects.choose" defaultMessage="Choose a list" />
          }
          variant="outlined"
        />
      )}
    />
  );
}
DestinationProjects.defaultProps = {
  value: null,
};
DestinationProjects.propTypes = {
  value: PropTypes.object, // GraphQL "Project" object or null
  team: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired, // func(<Project>) => undefined
  excludeProjectDbids: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
};

export default createFragmentContainer(DestinationProjects, graphql`
  fragment DestinationProjects_team on Team {
    name
    projects(first: 10000) {
      edges {
        node {
          id
          dbid  # here, UpdateProjectMediaMutation and BulkUpdateProjectMediaMutation
          search_id  # UpdateProjectMediaMutation and BulkUpdateProjectMediaMutation
          medias_count  # UpdateProjectMediaMutation and BulkUpdateProjectMediaMutation
          title
        }
      }
    }
  }
`);

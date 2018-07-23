// @flow
import * as React from 'react';
import { injectIntl, defineMessages, type IntlShape } from 'react-intl';
import throttle from 'lodash/throttle';
import { onChangeTextThrottle } from './core/TextInput';
import withMutation from './core/withMutation';
import withStore, { type Store } from './core/withStore';
import { pipe } from 'ramda';
import SetPostTextMutation, {
  type SetPostTextCommit,
} from '../mutations/SetPostTextMutation';
import { createFragmentContainer, graphql } from 'react-relay';
import * as generated from './__generated__/PostText.graphql';
import { Editor } from 'slate-react';
import { Value, resetKeyGenerator } from 'slate';
import Block from './core/Block';
import Text from './core/Text';

export const messages = defineMessages({
  placeholder: {
    defaultMessage: 'write',
    id: 'postText.textInput.placeholder',
  },
});

const schema = {
  document: {
    nodes: [{ types: ['paragraph'] }],
  },
  blocks: {
    paragraph: {
      nodes: [{ objects: ['text'] }],
    },
  },
};

const emptyText = {
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            leaves: [
              {
                text: '',
              },
            ],
          },
        ],
      },
    ],
  },
};

type PostTextProps = {|
  data: generated.PostText,
  intl: IntlShape,
  commit: SetPostTextCommit,
  store: Store,
  disabled?: boolean,
|};

type PostTextState = {|
  value: Object,
|};

class PostText extends React.PureComponent<PostTextProps, PostTextState> {
  throttleCommit = throttle(text => {
    const input = {
      id: this.props.data.id,
      text,
    };
    this.props.commit(input);
  }, onChangeTextThrottle);

  constructor(props) {
    super(props);
    const { text } = this.props.data;
    const json = text == null ? emptyText : JSON.parse(text);
    // https://docs.slatejs.org/slate-core/utils-1#resetkeygenerator
    resetKeyGenerator();
    const value = Value.fromJSON(json);
    this.state = { value };
  }

  handleEditorChange = ({ value }) => {
    this.setState({ value });
    if (value.document !== this.state.value.document) {
      const text = JSON.stringify(value.toJSON());
      this.throttleCommit(text);
    }
  };

  renderNode = props => {
    switch (props.node.type) {
      case 'paragraph':
        return (
          <Block>
            <Text {...props.attributes}>{props.children}</Text>
          </Block>
        );
    }
  };

  render() {
    const { intl } = this.props;
    return (
      <Editor
        value={this.state.value}
        onChange={this.handleEditorChange}
        renderNode={this.renderNode}
        placeholder={intl.formatMessage(messages.placeholder)}
        schema={schema}
      />
    );
  }
}

export default createFragmentContainer(
  pipe(
    injectIntl,
    withStore,
    withMutation(SetPostTextMutation),
  )(PostText),
  graphql`
    fragment PostText on Post {
      id
      text
    }
  `,
);
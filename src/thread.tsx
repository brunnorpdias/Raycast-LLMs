import { Detail, showToast, useNavigation, ActionPanel, Action, Cache, Icon, LocalStorage } from "@raycast/api";
import { useEffect, useState, useRef } from 'react';
import { Assistant } from './fetch/openAI';
import NewEntry from './newentry';

type Data = {
  assistant: string;
  conversation: Array<{ role: 'user' | 'assistant' | 'system', content: string }>;
  instructions: string;
  files: string[];
  model: string;
  temperature: number;
  timestamp: number;
  assistantID: string;
  threadID: string;
};

export default function Thread({ data }: { data: Data }) {
  const [startTime, setStartTime] = useState(0);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('');
  const [newData, setNewData] = useState<Data>(data);
  const hasRunRef = useRef(false);
  const { push } = useNavigation();

  useEffect(() => {
    if (startTime === 0) {
      setStartTime(Date.now());
    }
  }, [startTime]);

  useEffect(() => {
    if (!hasRunRef.current) {
      APIrequest(data);
    }
  }, [data]);

  function APIrequest(data: Data) {
    hasRunRef.current = true;

    const onResponse = (apiResponse: string, apiStatus: string) => {
      setStatus(apiStatus);
      setResponse((prevResponse) => prevResponse + apiResponse);
    };

    const fetchData = async () => {
      await Assistant(data, onResponse);
    };

    fetchData();
  }

  useEffect(() => {
    // add waiting status
    if (status === 'done') {
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      showToast({ title: 'Done', message: `Streaming took ${duration}s to complete` });
      const temp: Data = {
        ...data,
        conversation: [...data.conversation, { role: 'assistant', content: response }]
      }
      setNewData(temp);

      const cache = new Cache();
      cache.clear();
      cache.set('lastConversation', JSON.stringify(temp))
    };
  }, [status]);

  return (
    <Detail
      // navigationTitle
      markdown={response}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title='Copy Response'
            icon={Icon.Paragraph}
            content={response}
          />
          {/* <Action */}
          {/*   title="New Entry" */}
          {/*   icon={Icon.Plus} */}
          {/*   onAction={() => { */}
          {/*     push(<NewEntry data={newData} />) */}
          {/*   }} */}
          {/* /> */}
          <Action
            title="Summarise"
            icon={Icon.ShortParagraph}
            onAction={() => {
              hasRunRef.current = false;
              setResponse('')

              const temp: Data = {
                ...data,
                conversation: [
                  ...data.conversation,
                  { role: 'user', content: "Give a title for this conversation in a heading, then summarise the content on the conversation without mentioning that" }
                ]
              }
              push(<Thread data={temp} />)
            }}
          />
          <Action
            title="Main points"
            icon={Icon.BulletPoints}
            onAction={() => {
              hasRunRef.current = false;
              setResponse('')

              const temp: Data = {
                ...data,
                conversation: [
                  ...data.conversation,
                  { role: 'user', content: "Give a title for this conversation in a heading, then give the main points in bullets without mentioning so" }
                ]
              }
              push(<Thread data={temp} />)
            }}
          />
          <Action.CopyToClipboard
            title='Copy Data'
            icon={Icon.Download}
            content={JSON.stringify(newData?.conversation)}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  )
}
/*
    <Action
      title='Rewrite Prompt'
      onAction={() => {
        push(<
      }
    />
*/


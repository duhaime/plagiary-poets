from collections import defaultdict
import json, random, glob, operator, os

def reduce_corpus_plot_density():
  """Remove a selection of circles from the corpus plot in order to reduce DOM 
  strain on update of visualization. 
  min_sim: observations with similarityLater and similarityEarlier scores
    below this value will be candidates for removal
  survival_probability: describes the probability that each of the candidates
    for removal will be removed from the plot
  cutoff_year: only candidates for removal published after this year will
    remain candidates for removal"""

  min_sim = .1
  survival_probability = .35
  cutoff_year = 1740

  with open("../../expensive-json/influence.json") as f:
    f = json.load(f)
    refined_influence_json = []
    for i in f:
      # because observations for early years are sparse, save them all
      if float(i["year"]) > cutoff_year:
        if (float(i["similarityEarlier"]) < min_sim and
              float(i["similarityLater"]) < min_sim):
          random_float = random.uniform(0,1)
          if random_float < survival_probability:
            refined_influence_json.append(i)
        else:
          refined_influence_json.append(i)
      else:
        refined_influence_json.append(i)

    # print the starting and ending number of observations
    print "starting corpus observations:", len(f), 
    print "ending corpus observations:", len(refined_influence_json)

    with open("../json/influence.json",'w') as influence_out:
      json.dump(refined_influence_json, influence_out)


def reduce_passage_plot_observations():
  """Given the k nearest neighbors for each passage of a text,
  find the set of texts that have maximal aggregate similarity
  for the input text, and remove the other observations. Doing
  so is meant to help ensure that only the most relevant
  observations are plotted"""

  n_most_similar_texts = 8

  for i in glob.glob("../../expensive-json/alignments/*.json"):
    with open(i) as f:
      f = json.load(f)

      filtered_alignments = []
      similarity_dict = defaultdict(float)

      for j in f["alignments"]:
        
        sourceId = j["sourceId"]
        similarId = j["similarId"]
        similarity = float(j["similarity"])
        
        similarity_dict[similarId] += similarity
  
      # find the n texts with highest aggregate similarity      
      most_similar_text_ids = [k[0] for k in sorted(similarity_dict.iteritems(), 
            key=operator.itemgetter(1), 
            reverse = True)[:n_most_similar_texts]]

      # given those ids, iterate over the observations again and retain
      # only those whose similarId is in the most similar text ids
      # (that is, only retain observations if the text they're from is
      # one of the n most similar texts)

      for j in f["alignments"]:
        if j["similarId"] in most_similar_text_ids:
          filtered_alignments.append(j)

      # compose the outgoing json
      outgoing_json = {"bookendYears": f["bookendYears"], 
            "alignments": filtered_alignments}
      outgoing_alignment_path = "../json/alignments/" + os.path.basename(i)

      with open(outgoing_alignment_path, "w") as alignments_out:
        json.dump(outgoing_json, alignments_out)

      
if __name__ == "__main__":
  reduce_corpus_plot_density()
  reduce_passage_plot_observations() 

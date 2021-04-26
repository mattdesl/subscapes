# for i in {0..649}
# do

# node tools/cli-es5.js -d outputs -i $i -n $i.png;
# done

for i in $(seq -f "%03g" 0 649)
do
  node tools/cli-es5.js -d outputs -i $i -n $i.png
done